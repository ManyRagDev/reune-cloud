import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WaitlistRequest {
  email: string;
  source_url: string;
}

// SHA256 hash function
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Determine event name based on source URL
function getEventName(sourceUrl: string): string {
  const url = sourceUrl.toLowerCase();
  if (url.includes('/amigosecreto') || url.includes('/amigo-secreto')) {
    return 'Lead_AmigoSecreto';
  }
  return 'Lead_ReUNE';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { email, source_url }: WaitlistRequest = await req.json();

    if (!email || !source_url) {
      return new Response(
        JSON.stringify({ error: 'Email and source_url are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save to waitlist_reune table
    const { error: dbError } = await supabase
      .from('waitlist_reune')
      .insert({ email: email.toLowerCase() });

    // Ignore duplicate errors (email already exists)
    if (dbError && !dbError.message.includes('duplicate')) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save email to waitlist');
    }

    console.log('Email saved to waitlist:', email);

    // Send event to Meta Conversions API
    const metaToken = Deno.env.get('META_CONVERSIONS_TOKEN');
    const pixelId = Deno.env.get('META_PIXEL_ID');

    if (metaToken && pixelId) {
      const eventName = getEventName(source_url);
      const eventTime = Math.floor(Date.now() / 1000);
      const hashedEmail = await sha256(email.toLowerCase());

      // Get client IP and user agent
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
      const userAgent = req.headers.get('user-agent') || '';

      const metaPayload = {
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            action_source: 'website',
            event_source_url: source_url,
            user_data: {
              em: hashedEmail,
              client_ip_address: clientIp,
              client_user_agent: userAgent,
            },
          },
        ],
      };

      const metaUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${metaToken}`;

      const metaResponse = await fetch(metaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaPayload),
      });

      if (!metaResponse.ok) {
        const metaError = await metaResponse.text();
        console.error('Meta Conversions API error:', metaError);
        // Don't fail the request if Meta API fails
      } else {
        console.log('Event sent to Meta Conversions API:', eventName, email);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing waitlist request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
