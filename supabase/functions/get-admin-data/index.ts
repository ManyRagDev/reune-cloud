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

Deno.serve(async (req) => {
    // Handle CORS preflight
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

        // Initialize Supabase client with Service Role Key to bypass RLS for admin operations
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Validação de Acesso
        const authHeader = req.headers.get('Authorization');
        const jwt = authHeader?.replace(/^Bearer\s+/i, '');
        let userEmail: string | null = null;

        if (jwt) {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
                if (!authError && user?.email) {
                    userEmail = user.email.toLowerCase().trim();
                }
            } catch (err) {
                console.warn('Erro ao validar token JWT:', err);
            }
        }

        const isAdminByEmail = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail));
        const adminPassword = Deno.env.get('ADMIN_DASHBOARD_PASSWORD');
        const isPasswordValid = Boolean(adminPassword && password && password === adminPassword);

        if (!isAdminByEmail && !isPasswordValid) {
            console.error('⛔ Acesso negado. Email autenticado:', userEmail || 'Nenhum');
            return new Response(
                JSON.stringify({ error: 'Acesso negado. Apenas administradores autorizados têm acesso.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`✅ Acesso administrativo concedido para: ${userEmail || 'via senha'}`);

        // Fetch Waitlist
        const { data: waitlist, error: waitlistError } = await supabase
            .from("waitlist_reune")
            .select("*")
            .order("created_at", { ascending: false });

        if (waitlistError) throw waitlistError;

        // Fetch Registered Users (TODOS os auth.users + profiles se existir)
        let users: any[] = [];
        try {
            const { data: authUsersResponse, error: authUsersError } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
            });

            if (authUsersError) throw authUsersError;
            const authUsers = authUsersResponse?.users || [];

            console.log(`📊 Total de usuários em auth.users: ${authUsers.length}`);

            if (authUsers.length > 0) {
                const userIds = authUsers.map(u => u.id);

                // Buscar profiles para esses usuários
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select(`
                        id,
                        created_at,
                        display_name,
                        username,
                        phone,
                        is_founder,
                        founder_since,
                        premium_until,
                        storage_multiplier
                    `)
                    .in('id', userIds);

                // Buscar email_logs para verificar se enviou emails
                const { data: emailLogs } = await supabase
                    .from('email_logs')
                    .select('lead_id, sent_at, status')
                    .in('lead_id', userIds)
                    .in('status', ['success', 'delivered', 'opened', 'clicked', 'pending'])
                    .order('sent_at', { ascending: false });

                // Combinar auth.users com profiles e email logs
                users = authUsers.map(authUser => {
                    const profile = profilesData?.find(p => p.id === authUser.id);
                    const userEmailLog = emailLogs?.find(log => log.lead_id === authUser.id);
                    const meta = authUser.user_metadata || {};

                    return {
                        id: authUser.id,
                        email: authUser.email || 'Email não encontrado',
                        name: profile?.display_name || meta.full_name || meta.name || meta.display_name || profile?.username || null,
                        username: profile?.username || null,
                        phone: profile?.phone || authUser.phone || null,
                        provider: authUser.app_metadata?.provider || 'email',
                        created_at: profile?.created_at || authUser.created_at,
                        last_sign_in_at: authUser.last_sign_in_at || null,
                        is_founder: profile?.is_founder || false,
                        founder_since: profile?.founder_since || null,
                        premium_until: profile?.premium_until || null,
                        storage_multiplier: profile?.storage_multiplier || 1,
                        welcome_email_sent: !!userEmailLog,
                        welcome_email_sent_at: userEmailLog?.sent_at || null,
                    };
                });

                // Ordenar por data de cadastro mais recente primeiro
                users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                console.log(`✅ Total de usuários processados: ${users.length}`);
            }
        } catch (error) {
            console.error('⚠️  Failed to fetch users:', error);
        }

        // Fetch Secret Santa Events
        const { data: events, error: eventsError } = await supabase
            .from("event_secret_santa")
            .select(`
                *,
                table_reune (
                    title,
                    user_id
                )
            `)
            .order("created_at", { ascending: false });

        if (eventsError) throw eventsError;

        // Fetch Email Templates
        let templates = [];
        try {
            const { data, error: templatesError } = await supabase
                .from("email_templates")
                .select("*")
                .order("created_at", { ascending: false });

            if (!templatesError && data) {
                templates = data;
            }
        } catch (error) {
            console.error('⚠️  Failed to fetch templates:', error);
        }

        // Fetch Admin Settings
        let settings = [];
        try {
            const { data, error: settingsError } = await supabase
                .from("admin_settings")
                .select("*");

            if (!settingsError && data) {
                settings = data;
            }
        } catch (error) {
            console.error('⚠️  Failed to fetch settings:', error);
        }

        // Fetch Email Stats (últimos 30 dias)
        let emailStats = null;
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data } = await supabase
                .from("email_logs")
                .select("status, sent_at")
                .gte("sent_at", thirtyDaysAgo.toISOString());

            emailStats = data;
        } catch (error) {
            console.error('⚠️  Failed to fetch email logs:', error);
        }

        const stats = {
            total: emailStats?.length || 0,
            success: emailStats?.filter(e => e.status === 'success').length || 0,
            failed: emailStats?.filter(e => e.status === 'failed').length || 0,
            pending: emailStats?.filter(e => e.status === 'pending').length || 0,
        };

        const leadsWithoutWelcome = waitlist?.filter(lead => !lead.welcome_email_sent).length || 0;

        return new Response(
            JSON.stringify({
                waitlist: waitlist || [],
                users: users || [],
                events: events || [],
                templates: templates || [],
                settings: settings || [],
                emailStats: stats,
                leadsWithoutWelcome,
                authenticatedAs: userEmail || 'admin-password'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error fetching admin data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
