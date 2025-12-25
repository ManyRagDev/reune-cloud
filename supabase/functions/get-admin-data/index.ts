import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { password } = body;

        console.log('?Y"? Password received:', password ? '?o. Present' : '??O Missing');

        const adminPassword = Deno.env.get('ADMIN_DASHBOARD_PASSWORD');
        if (!adminPassword) {
            throw new Error('ADMIN_DASHBOARD_PASSWORD n??o configurada');
        }


        // Simple password check (in a real app, use Supabase Auth or a secure secret)
        if (password !== adminPassword) {
            console.error('❌ Password validation failed. Received:', password);
            return new Response(
                JSON.stringify({ error: 'Unauthorized', received: password }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('✅ Password validated successfully');

        // Initialize Supabase client with Service Role Key to bypass RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch Waitlist
        const { data: waitlist, error: waitlistError } = await supabase
            .from("waitlist_reune")
            .select("*")
            .order("created_at", { ascending: false });

        if (waitlistError) throw waitlistError;

        // Fetch Registered Users (TODOS os auth.users + profiles se existir)
        let users = [];
        try {
            // Buscar TODOS os usuários de auth.users
            const { data: authUsersResponse } = await supabase.auth.admin.listUsers();
            const authUsers = authUsersResponse?.users || [];

            console.log(`📊 Total de usuários em auth.users: ${authUsers.length}`);

            if (authUsers.length > 0) {
                const userIds = authUsers.map(u => u.id);

                // Buscar profiles para esses usuários (pode não existir para todos)
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select(`
                        id,
                        created_at,
                        is_founder,
                        founder_since,
                        premium_until,
                        storage_multiplier
                    `)
                    .in('id', userIds);

                console.log(`📊 Total de profiles encontrados: ${profilesData?.length || 0}`);

                // Buscar email_logs para verificar se enviou emails
                // Aceitar todos os status de sucesso (não apenas 'success')
                const { data: emailLogs } = await supabase
                    .from('email_logs')
                    .select('lead_id, sent_at, status')
                    .in('lead_id', userIds)
                    .in('status', ['success', 'delivered', 'opened', 'clicked', 'pending'])
                    .order('sent_at', { ascending: false });

                console.log(`📊 Total de email logs encontrados: ${emailLogs?.length || 0}`);

                // Combinar TODOS os auth.users com profiles (se existir) e logs
                users = authUsers.map(authUser => {
                    const profile = profilesData?.find(p => p.id === authUser.id);
                    const userEmailLog = emailLogs?.find(log => log.lead_id === authUser.id);

                    return {
                        id: authUser.id,
                        email: authUser.email || 'Email não encontrado',
                        name: authUser.user_metadata?.name || null,
                        created_at: profile?.created_at || authUser.created_at,
                        is_founder: profile?.is_founder || false,
                        founder_since: profile?.founder_since || null,
                        premium_until: profile?.premium_until || null,
                        storage_multiplier: profile?.storage_multiplier || 1,
                        welcome_email_sent: !!userEmailLog,
                        welcome_email_sent_at: userEmailLog?.sent_at || null,
                    };
                });

                console.log(`✅ Total de usuários retornados: ${users.length}`);
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

        // Fetch Email Templates (pode não existir ainda)
        let templates = [];
        try {
            const { data, error: templatesError } = await supabase
                .from("email_templates")
                .select("*")
                .order("created_at", { ascending: false });

            if (templatesError) {
                console.error('⚠️  Email templates table not found or error:', templatesError.message);
            } else {
                templates = data || [];
            }
        } catch (error) {
            console.error('⚠️  Failed to fetch templates:', error);
        }

        // Fetch Admin Settings (pode não existir ainda)
        let settings = [];
        try {
            const { data, error: settingsError } = await supabase
                .from("admin_settings")
                .select("*");

            if (settingsError) {
                console.error('⚠️  Admin settings table not found or error:', settingsError.message);
            } else {
                settings = data || [];
            }
        } catch (error) {
            console.error('⚠️  Failed to fetch settings:', error);
        }

        // Fetch Email Stats (últimos 30 dias) - pode não existir ainda
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

        // Calcular leads sem boas-vindas
        const leadsWithoutWelcome = waitlist?.filter(lead => !lead.welcome_email_sent).length || 0;

        return new Response(
            JSON.stringify({
                waitlist,
                users,
                events,
                templates: templates || [],
                settings: settings || [],
                emailStats: stats,
                leadsWithoutWelcome
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
