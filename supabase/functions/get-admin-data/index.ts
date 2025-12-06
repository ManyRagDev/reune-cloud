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

        console.log('🔐 Password received:', password ? '✅ Present' : '❌ Missing', 'Value:', password);

        // Simple password check (in a real app, use Supabase Auth or a secure secret)
        if (password !== "2025") {
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
