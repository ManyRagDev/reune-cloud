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
        const { password } = await req.json();

        // Simple password check (in a real app, use Supabase Auth or a secure secret)
        if (password !== "2025") {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

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

        return new Response(
            JSON.stringify({ waitlist, events }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error fetching admin data:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
