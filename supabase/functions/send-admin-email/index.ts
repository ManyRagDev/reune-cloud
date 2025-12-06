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
        // Buscar dados do lead
        const { data: lead, error: leadError } = await supabase
          .from('waitlist_reune')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (leadError || !lead) {
          results.push({
            lead_id,
            status: 'failed',
            error: 'Lead não encontrado'
          });
          continue;
        }

        // Preparar variáveis do template
        const templateVars = {
          nome: lead.name || '',
          email: lead.email,
          ...variables
        };

        // Substituir variáveis no HTML
        const emailHtml = replaceVariables(template.html_content, templateVars);
        const emailSubject = replaceVariables(template.subject, templateVars);

        // Enviar via Resend
        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: [lead.email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log('✅ E-mail enviado:', lead.email, emailResponse);

        // Registrar log
        await supabase.from('email_logs').insert({
          lead_id: lead.id,
          lead_email: lead.email,
          template_name: template_name,
          status: 'success',
          metadata: {
            resend_message_id: emailResponse.id,
            variables: templateVars
          }
        });

        // Se for template de boas-vindas, atualizar flag do lead
        if (template_name === 'boas_vindas' || template.name.includes('bem_vind') || template.name.includes('welcome')) {
          await supabase
            .from('waitlist_reune')
            .update({
              welcome_email_sent: true,
              welcome_email_sent_at: new Date().toISOString()
            })
            .eq('id', lead.id);
        }

        results.push({
          lead_id: lead.id,
          lead_email: lead.email,
          status: 'success',
          message_id: emailResponse.id
        });

      } catch (error: any) {
        console.error('❌ Erro ao enviar para lead:', lead_id, error);

        // Registrar log de erro
        try {
          const { data: failedLead } = await supabase
            .from('waitlist_reune')
            .select('email')
            .eq('id', lead_id)
            .single();

          await supabase.from('email_logs').insert({
            lead_id: lead_id,
            lead_email: failedLead?.email || 'unknown',
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
