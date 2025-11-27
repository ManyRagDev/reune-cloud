import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecretSantaNotificationRequest {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  secretSantaId: string;
  participants: Array<{
    email: string;
    displayName: string;
  }>;
}

function createEmailTemplate(props: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventUrl: string;
}): string {
  const { participantName, eventTitle, eventDate, eventUrl } = props;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sorteio do Amigo Secreto Realizado!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with festive gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 16px;">🎁</div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Sorteio Realizado!
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 12px 0 0 0;">
                O Amigo Secreto foi sorteado
              </p>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá, <strong>${participantName}</strong>! 👋
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                O sorteio do <strong>Amigo Secreto</strong> do evento <strong>"${eventTitle}"</strong> foi realizado!
              </p>
              
              <!-- Event info card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f3e8ff; border-radius: 12px; padding: 20px;">
                    <p style="color: #7c3aed; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                      📅 Evento
                    </p>
                    <p style="color: #374151; font-size: 18px; font-weight: 600; margin: 0 0 4px 0;">
                      ${eventTitle}
                    </p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                      ${eventDate}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Entre no ReUNE para descobrir quem você tirou e ver a lista de desejos da pessoa!
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                      🎄 Ver Meu Amigo Secreto
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Secret reminder -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="background-color: #fef3c7; border-radius: 12px; padding: 16px 20px; border-left: 4px solid #f59e0b;">
                    <p style="color: #92400e; font-size: 14px; margin: 0;">
                      <strong>🤫 Lembre-se:</strong> Mantenha o segredo! Não conte para ninguém quem você tirou.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px 0;">
                Enviado por <strong style="color: #7c3aed;">ReUNE</strong>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                A plataforma que reúne pessoas em eventos especiais ✨
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      eventId, 
      eventTitle, 
      eventDate, 
      secretSantaId,
      participants 
    }: SecretSantaNotificationRequest = await req.json();

    console.log(`[Secret Santa Notification] Starting for event ${eventId} with ${participants.length} participants`);

    const baseUrl = Deno.env.get("SITE_URL") || "https://preview--reune-ee4c3a54.lovable.app";
    const eventUrl = `${baseUrl}/event/${eventId}/secret-santa/my-result`;

    // Format date for display
    const formattedDate = new Date(eventDate).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const results = [];

    // Send email to each participant
    for (const participant of participants) {
      if (!participant.email) {
        console.log(`[Secret Santa Notification] Skipping participant without email: ${participant.displayName}`);
        results.push({ email: null, success: false, error: "No email" });
        continue;
      }

      try {
        const html = createEmailTemplate({
          participantName: escapeHtml(participant.displayName || "Participante"),
          eventTitle: escapeHtml(eventTitle),
          eventDate: formattedDate,
          eventUrl,
        });

        const emailResponse = await resend.emails.send({
          from: "ReUNE <noreply@resend.dev>",
          to: [participant.email],
          subject: `🎁 Sorteio do Amigo Secreto realizado - ${eventTitle}`,
          html,
        });

        console.log(`[Secret Santa Notification] Email sent to ${participant.email}:`, emailResponse);
        results.push({ email: participant.email, success: true, id: emailResponse.data?.id });
      } catch (emailError: any) {
        console.error(`[Secret Santa Notification] Failed to send to ${participant.email}:`, emailError);
        results.push({ email: participant.email, success: false, error: emailError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Secret Santa Notification] Completed: ${successCount}/${participants.length} emails sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: participants.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[Secret Santa Notification] Error:", error);
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
