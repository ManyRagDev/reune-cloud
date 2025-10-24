import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FriendInvitationRequest {
  receiverEmail: string;
  senderName: string;
  invitationToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiverEmail, senderName, invitationToken }: FriendInvitationRequest = await req.json();

    const invitationUrl = `${Deno.env.get("VITE_SUPABASE_URL")}/auth/v1/verify?token=${invitationToken}&type=invite`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ReUNE <onboarding@resend.dev>",
        to: [receiverEmail],
        subject: `${senderName} quer ser seu amigo no ReUNE`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Convite de Amizade</h1>
              </div>
              <div class="content">
                <p>Olá!</p>
                <p><strong>${senderName}</strong> está convidando você para ser amigo no <strong>ReUNE</strong>, o aplicativo que organiza eventos sem caos!</p>
                <p>Com o ReUNE, vocês poderão:</p>
                <ul>
                  <li>Organizar eventos juntos com ajuda de IA</li>
                  <li>Dividir tarefas e custos automaticamente</li>
                  <li>Receber convites e confirmar presença facilmente</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${invitationUrl}" class="button">Aceitar Convite e Cadastrar-se</a>
                </p>
                <p style="color: #666; font-size: 14px;">Este link expira em 7 dias.</p>
              </div>
              <div class="footer">
                <p>ReUNE - Organize eventos sem caos, com ajuda de IA</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Friend invitation email sent:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending friend invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
