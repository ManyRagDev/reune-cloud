import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  invitee_email: string;
  invitee_name: string;
  event_title: string;
  event_date: string;
  event_time: string;
  event_location?: string;
  is_organizer: boolean;
  invitation_token: string;
}

const createEmailTemplate = (props: {
  invitee_name: string;
  event_title: string;
  event_date: string;
  event_time: string;
  event_location?: string;
  is_organizer: boolean;
  accept_url: string;
}) => {
  const roleText = props.is_organizer ? 'organizador(a)' : 'participante';
  const roleEmoji = props.is_organizer ? '👑' : '🎉';
  
  const formattedDate = new Date(props.event_date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite - ${props.event_title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                
                <!-- Logo -->
                <tr>
                  <td align="center" style="padding: 32px 20px 0;">
                    <img src="https://tfrogqqqmgfgfybesglq.supabase.co/storage/v1/object/public/reune-logo.png" alt="ReUNE" style="height: 60px; width: auto;">
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td align="center" style="padding: 32px 20px 0;">
                    <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">
                      Olá, ${props.invitee_name}! 👋
                    </h1>
                  </td>
                </tr>

                <!-- Role Badge -->
                <tr>
                  <td style="padding: 24px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #f0f9ff; border-radius: 8px; padding: 12px 20px;">
                          <p style="margin: 0; color: #0369a1; font-size: 16px; line-height: 1.5;">
                            ${roleEmoji} Você foi convidado(a) como <strong>${roleText}</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Event Card -->
                <tr>
                  <td style="padding: 0 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 2px solid #e5e7eb; border-radius: 12px;">
                      <tr>
                        <td style="padding: 24px;">
                          <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                            ${props.event_title}
                          </h2>
                          
                          <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 8px 0;">
                            📅 <strong>Data:</strong> ${formattedDate}
                          </p>
                          
                          <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 8px 0;">
                            🕐 <strong>Horário:</strong> ${props.event_time}
                          </p>
                          
                          ${props.event_location ? `
                          <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 8px 0;">
                            📍 <strong>Local:</strong> ${props.event_location}
                          </p>
                          ` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Role Description -->
                <tr>
                  <td style="padding: 0 20px 24px;">
                    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 8px 0;">
                      Como <strong>${roleText}</strong>, você ${props.is_organizer ? 'terá permissões especiais para' : 'poderá'}:
                    </p>
                    <ul style="margin: 8px 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 22px;">
                      ${props.is_organizer ? `
                        <li style="margin: 6px 0;">Gerenciar participantes e organizadores</li>
                        <li style="margin: 6px 0;">Distribuir e atribuir itens do evento</li>
                        <li style="margin: 6px 0;">Editar detalhes do evento</li>
                        <li style="margin: 6px 0;">Acompanhar confirmações e sugestões</li>
                      ` : `
                        <li style="margin: 6px 0;">Confirmar sua presença no evento</li>
                        <li style="margin: 6px 0;">Sugerir alterações de data, horário ou local</li>
                        <li style="margin: 6px 0;">Ver detalhes e itens do evento</li>
                        <li style="margin: 6px 0;">Interagir com outros participantes</li>
                      `}
                    </ul>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 8px 20px 24px;">
                    <a href="${props.accept_url}" style="display: inline-block; background-color: #0ea5e9; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; line-height: 1.5;">
                      ✨ Aceitar Convite
                    </a>
                  </td>
                </tr>

                <!-- Info Box -->
                <tr>
                  <td style="padding: 0 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                            💡 <strong>Primeira vez no ReUNE?</strong> Ao aceitar o convite, você poderá criar sua conta e começar a organizar eventos de forma simples e eficiente!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 8px 20px;">
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 24px 20px 32px;">
                    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0;">
                      <strong>ReUNE</strong> - Planejamento de eventos simplificado
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 4px 0;">
                      reuneapp.com.br
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 4px 0;">
                      Se você não solicitou este convite, pode ignorar este e-mail com segurança.
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      invitee_email, 
      invitee_name, 
      event_title, 
      event_date, 
      event_time,
      event_location,
      is_organizer,
      invitation_token 
    }: InvitationEmailRequest = await req.json();

    console.log('📧 Enviando convite para:', invitee_email);

    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || '';
    const acceptUrl = `${appUrl}/accept-invite?token=${invitation_token}`;

    const emailHtml = createEmailTemplate({
      invitee_name,
      event_title,
      event_date,
      event_time,
      event_location,
      is_organizer,
      accept_url: acceptUrl,
    });

    const emailResponse = await resend.emails.send({
      from: 'ReUNE <noreply@reuneapp.com.br>',
      to: [invitee_email],
      subject: `✨ Convite para ${event_title}`,
      html: emailHtml,
    });

    console.log('✅ Email enviado com sucesso:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email enviado com sucesso' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
