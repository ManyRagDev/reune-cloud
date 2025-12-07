import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  lead_ids: string[];
  template_name: string;
  variables?: Record<string, string>;
  password: string;
}

// Substituir variáveis no HTML: {{nome}} -> "João"
function replaceVariables(html: string, variables: Record<string, string>): string {
  let result = html;

  for (const [key, value] of Object.entries(variables)) {
    // Suporta {{variavel}} e {{#if variavel}}valor{{/if}}
    const simpleRegex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(simpleRegex, value || '');

    // Suporta condicionais simples: {{#if nome}}, {{nome}}{{/if}}
    const conditionalRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g');
    result = result.replace(conditionalRegex, value ? '$1' : '');
  }

  // Remove condicionais de variáveis não fornecidas
  result = result.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, '');

  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_ids, template_name, variables = {}, password }: SendEmailRequest = await req.json();

    // Validar senha admin
    if (password !== "2025") {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar inputs
    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'lead_ids é obrigatório e deve ser um array não vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!template_name) {
      return new Response(
        JSON.stringify({ error: 'template_name é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase com Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', template_name)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: `Template '${template_name}' não encontrado ou inativo` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações
    const { data: fromEmailSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'from_email')
      .single();

    const fromEmail = fromEmailSetting?.value || 'ReUNE <noreply@reuneapp.com.br>';

    // Processar envio para cada lead
    const results = [];

    for (const lead_id of lead_ids) {
      try {
        let recipientData: any = null;
        let isRegisteredUser = false;

        // Tentar buscar da tabela waitlist_reune primeiro
        const { data: waitlistLead } = await supabase
          .from('waitlist_reune')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (waitlistLead) {
          recipientData = waitlistLead;
          isRegisteredUser = false;
        } else {
          // Se não encontrou na waitlist, buscar da tabela profiles (users registrados)
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, created_at, is_founder')
            .eq('id', lead_id)
            .single();

          if (userProfile) {
            // Buscar email do auth.users
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.id === userProfile.id);

            if (authUser) {
              recipientData = {
                id: userProfile.id,
                name: authUser.user_metadata?.name || null,
                email: authUser.email,
                created_at: userProfile.created_at
              };
              isRegisteredUser = true;
            }
          }
        }

        if (!recipientData) {
          results.push({
            lead_id,
            status: 'failed',
            error: 'Destinatário não encontrado (nem na waitlist nem nos usuários registrados)'
          });
          continue;
        }

        // Preparar variáveis do template
        const templateVars = {
          nome: recipientData.name || '',
          email: recipientData.email,
          ...variables
        };

        // Substituir variáveis no HTML
        const emailHtml = replaceVariables(template.html_content, templateVars);
        const emailSubject = replaceVariables(template.subject, templateVars);

        // Enviar via Resend
        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: [recipientData.email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log('✅ E-mail enviado:', recipientData.email, emailResponse, isRegisteredUser ? '(User registrado)' : '(Waitlist)');

        // Registrar log
        await supabase.from('email_logs').insert({
          lead_id: recipientData.id,
          lead_email: recipientData.email,
          template_name: template_name,
          status: 'success',
          metadata: {
            resend_message_id: emailResponse.id,
            variables: templateVars,
            recipient_type: isRegisteredUser ? 'registered_user' : 'waitlist'
          }
        });

        // Se for template de boas-vindas, atualizar flag
        if (template_name === 'boas_vindas' || template.name.includes('bem_vind') || template.name.includes('welcome')) {
          if (isRegisteredUser) {
            // Para users registrados, não temos campo welcome_email_sent na tabela profiles
            // O rastreamento é feito apenas via email_logs
            console.log('📧 Email de boas-vindas enviado para user registrado:', recipientData.email);
          } else {
            // Para waitlist, atualizar flag
            await supabase
              .from('waitlist_reune')
              .update({
                welcome_email_sent: true,
                welcome_email_sent_at: new Date().toISOString()
              })
              .eq('id', recipientData.id);
          }
        }

        results.push({
          lead_id: recipientData.id,
          lead_email: recipientData.email,
          status: 'success',
          message_id: emailResponse.id
        });

      } catch (error: any) {
        console.error('❌ Erro ao enviar para lead:', lead_id, error);

        // Registrar log de erro
        try {
          let failedEmail = 'unknown';

          // Tentar buscar email da waitlist
          const { data: failedLead } = await supabase
            .from('waitlist_reune')
            .select('email')
            .eq('id', lead_id)
            .single();

          if (failedLead) {
            failedEmail = failedLead.email;
          } else {
            // Tentar buscar do auth.users
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.id === lead_id);
            if (authUser) {
              failedEmail = authUser.email || 'unknown';
            }
          }

          await supabase.from('email_logs').insert({
            lead_id: lead_id,
            lead_email: failedEmail,
            template_name: template_name,
            status: 'failed',
            error_message: error.message,
            metadata: { variables }
          });
        } catch (logError) {
          console.error('❌ Erro ao registrar log:', logError);
        }

        results.push({
          lead_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enviados: ${successCount} | Falhas: ${failedCount}`,
        results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
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
