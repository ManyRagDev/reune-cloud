import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

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
  is_organizer: boolean;
  invitation_token: string;
}

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
      is_organizer,
      invitation_token 
    }: InvitationEmailRequest = await req.json();

    console.log('📧 Enviando convite para:', invitee_email);

    const roleText = is_organizer ? 'organizador(a)' : 'participante';
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || '';
    const acceptUrl = `${appUrl}/accept-invite?token=${invitation_token}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo {
              max-width: 180px;
              height: auto;
            }
            .content {
              padding: 30px 0;
            }
            .event-details {
              background-color: #f8f9fa;
              border-left: 4px solid #0066cc;
              padding: 15px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #0066cc;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 2px solid #f0f0f0;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://tfrogqqqmgfgfybesglq.supabase.co/storage/v1/object/public/reune-logo.png" alt="ReUNE" class="logo" />
          </div>
          
          <div class="content">
            <h1>Olá, ${invitee_name}! 👋</h1>
            
            <p>Você foi convidado(a) como <strong>${roleText}</strong> para participar de um evento:</p>
            
            <div class="event-details">
              <h2 style="margin-top: 0;">${event_title}</h2>
              <p><strong>📅 Data:</strong> ${new Date(event_date).toLocaleDateString('pt-BR')}</p>
              <p><strong>🕐 Horário:</strong> ${event_time}</p>
            </div>
            
            ${is_organizer ? 
              '<p>Como organizador(a), você terá permissões para gerenciar participantes e distribuir itens do evento.</p>' 
              : 
              '<p>Você poderá confirmar sua presença, sugerir alterações e ver os detalhes do evento.</p>'
            }
            
            <center>
              <a href="${acceptUrl}" class="button">Aceitar Convite</a>
            </center>
            
            <p>Caso você ainda não tenha o app ReUNE, baixe agora e organize seus eventos de forma simples e eficiente!</p>
          </div>
          
          <div class="footer">
            <p>ReUNE - Planejamento de eventos simplificado</p>
            <p style="font-size: 12px;">Se você não solicitou este convite, pode ignorar este e-mail.</p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: 'ReUNE <onboarding@resend.dev>',
      to: [invitee_email],
      subject: `Convite: ${event_title}`,
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
