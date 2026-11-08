import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAILS = [
    'emanuel.adm10@gmail.com',
    'teste@reune.com',
    'teste2@reune.dot'
];

/**
 * Converte chave privada PEM em CryptoKey PKCS#8 para Web Crypto API
 */
function pemToBinary(pem: string): ArrayBuffer {
    const cleanPem = pem
        .replace(/\\n/g, '\n')
        .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/, '')
        .replace(/-----END (?:RSA )?PRIVATE KEY-----/, '')
        .replace(/\s+/g, '');
    const binaryString = atob(cleanPem);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Gera token JWT assinado para autenticação com Google OAuth2
 */
async function getGoogleAccessToken(serviceAccount: Record<string, string>): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat,
    };

    const encodeB64Url = (obj: Record<string, unknown>) =>
        btoa(JSON.stringify(obj))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

    const unsignedToken = `${encodeB64Url(header)}.${encodeB64Url(claim)}`;
    const enc = new TextEncoder();

    const privateKeyBuffer = pemToBinary(serviceAccount.private_key);
    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        enc.encode(unsignedToken)
    );

    const signatureB64Url = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const signedJwt = `${unsignedToken}.${signatureB64Url}`;

    // Solicitar Access Token ao Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: signedJwt,
        }),
    });

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Falha na autenticação do Google OAuth: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        let body: Record<string, unknown> = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const password = typeof body.password === 'string' ? body.password : null;

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Validação de Admin
        const authHeader = req.headers.get('Authorization');
        const jwt = authHeader?.replace(/^Bearer\s+/i, '');
        let userEmail: string | null = null;

        if (jwt) {
            try {
                const { data: { user } } = await supabase.auth.getUser(jwt);
                if (user?.email) userEmail = user.email.toLowerCase().trim();
            } catch (_) {
                // Ignore
            }
        }

        const isAdminByEmail = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail));
        const adminPassword = Deno.env.get('ADMIN_DASHBOARD_PASSWORD');
        const isPasswordValid = Boolean(adminPassword && password && password === adminPassword);
        const isServiceRole = Boolean(jwt && jwt === supabaseKey);

        if (!isAdminByEmail && !isPasswordValid && !isServiceRole) {
            return new Response(
                JSON.stringify({ error: 'Acesso negado. Apenas administradores autorizados têm acesso.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Recupera credenciais: primeiro tenta Deno.env, depois busca em admin_settings
        let rawServiceAccount = Deno.env.get('GA_SERVICE_ACCOUNT_KEY');
        let propertyId = Deno.env.get('GA_PROPERTY_ID');

        let serviceAccount: Record<string, string> | null = null;
        if (rawServiceAccount) {
            try {
                serviceAccount = JSON.parse(rawServiceAccount);
            } catch (_) {
                try {
                    serviceAccount = JSON.parse(atob(rawServiceAccount));
                } catch {
                    serviceAccount = null;
                }
            }
        }

        if (!serviceAccount || !propertyId) {
            try {
                const { data: dbSettings } = await supabase
                    .from('admin_settings')
                    .select('key, value')
                    .in('key', ['ga_service_account', 'ga_property_id']);

                if (dbSettings) {
                    for (const s of dbSettings) {
                        if (s.key === 'ga_service_account' && s.value) {
                            serviceAccount = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
                        }
                        if (s.key === 'ga_property_id' && s.value) {
                            propertyId = typeof s.value === 'string' ? s.value : String(s.value);
                        }
                    }
                }
            } catch (err) {
                console.warn('Erro ao carregar admin_settings:', err);
            }
        }

        if (!propertyId) propertyId = '563180016';

        // Se credenciais do Google Cloud Service Account estiverem configuradas:
        if (serviceAccount?.client_email && serviceAccount?.private_key) {
            try {
                const accessToken = await getGoogleAccessToken(serviceAccount);
                const numericPropertyId = propertyId.replace(/^properties\//, '').replace(/^G-/, '');

                // 1. Relatório em Tempo Real (Realtime)
                const realtimeRes = await fetch(
                    `https://analyticsdata.googleapis.com/v1beta/properties/${numericPropertyId}:runRealtimeReport`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            metrics: [{ name: 'activeUsers' }],
                        }),
                    }
                );

                const realtimeData = realtimeRes.ok ? await realtimeRes.json() : null;
                const activeUsersNow = Number(realtimeData?.rows?.[0]?.metricValues?.[0]?.value || 0);

                // 2. Relatório Consolidado de Páginas (Últimos 30 dias)
                const reportRes = await fetch(
                    `https://analyticsdata.googleapis.com/v1beta/properties/${numericPropertyId}:runReport`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                            metrics: [
                                { name: 'activeUsers' },
                                { name: 'screenPageViews' },
                                { name: 'sessions' },
                            ],
                            dimensions: [{ name: 'pagePath' }],
                            limit: 10,
                        }),
                    }
                );

                const reportData = reportRes.ok ? await reportRes.json() : null;

                const topPages = (reportData?.rows || []).map((row: any) => ({
                    path: row.dimensionValues?.[0]?.value || '/',
                    views: Number(row.metricValues?.[1]?.value || 0),
                    users: Number(row.metricValues?.[0]?.value || 0),
                }));

                // 3. Relatório de Eventos (Últimos 30 dias)
                const eventsRes = await fetch(
                    `https://analyticsdata.googleapis.com/v1beta/properties/${numericPropertyId}:runReport`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                            dimensions: [{ name: 'eventName' }],
                            metrics: [{ name: 'eventCount' }],
                            limit: 15,
                        }),
                    }
                );

                const eventsData = eventsRes.ok ? await eventsRes.json() : null;
                const topEvents = (eventsData?.rows || []).map((row: any) => ({
                    name: row.dimensionValues?.[0]?.value || '',
                    count: Number(row.metricValues?.[0]?.value || 0),
                }));

                // 4. Divisão Mobile vs Desktop
                const devicesRes = await fetch(
                    `https://analyticsdata.googleapis.com/v1beta/properties/${numericPropertyId}:runReport`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                            dimensions: [{ name: 'deviceCategory' }],
                            metrics: [{ name: 'activeUsers' }],
                        }),
                    }
                );

                const devicesData = devicesRes.ok ? await devicesRes.json() : null;
                let mobileCount = 0;
                let desktopCount = 0;
                for (const d of (devicesData?.rows || [])) {
                    const cat = d.dimensionValues?.[0]?.value?.toLowerCase() || '';
                    const count = Number(d.metricValues?.[0]?.value || 0);
                    if (cat === 'mobile' || cat === 'tablet') mobileCount += count;
                    else desktopCount += count;
                }
                const devTotal = mobileCount + desktopCount || 1;
                const mobilePct = Math.round((mobileCount / devTotal) * 100);
                const desktopPct = 100 - mobilePct;

                // Totais calculados
                const totalPageviews30d = topPages.reduce((acc: number, curr: any) => acc + curr.views, 0);
                const totalUsers30d = (devicesData?.rows || []).reduce((acc: number, curr: any) => acc + Number(curr.metricValues?.[0]?.value || 0), 0);
                const totalSessions30d = (reportData?.rows || []).reduce((acc: number, curr: any) => acc + Number(curr.metricValues?.[2]?.value || 0), 0);

                return new Response(
                    JSON.stringify({
                        configured: true,
                        propertyId: numericPropertyId,
                        metrics: {
                            activeUsersNow,
                            totalUsers30d,
                            totalPageviews30d,
                            totalSessions30d,
                            topPages,
                            topEvents,
                            deviceBreakdown: { mobile: mobilePct, desktop: desktopPct },
                        },
                        updatedAt: new Date().toISOString(),
                    }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            } catch (err: any) {
                console.error('Erro ao consultar GA Data API:', err);
                return new Response(
                    JSON.stringify({
                        error: 'Erro na API do Google Analytics',
                        details: err?.message,
                        configured: true,
                    }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // Fallback se não configurado
        return new Response(
            JSON.stringify({
                configured: false,
                propertyId,
                message: 'Chave de serviço Google Cloud não configurada.',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Erro geral get-ga-metrics:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', details: error?.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
