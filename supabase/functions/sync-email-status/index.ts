import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  password: string;
  hours_back?: number; // Quantas horas atrás verificar (padrão: 24)
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, hours_back = 24 }: SyncRequest = await req.json();

    // Validar senha admin
    const adminPassword = Deno.env.get('ADMIN_DASHBOARD_PASSWORD');
    if (!adminPassword) {
      throw new Error('ADMIN_DASHBOARD_PASSWORD n??o configurada');
    }

    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Iniciando sincronização de emails das últimas ${hours_back} horas`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    // Inicializar Supabase com Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar logs recentes com resend_message_id
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours_back);

    const { data: emailLogs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .gte('sent_at', hoursAgo.toISOString())
      .not('metadata->>resend_message_id', 'is', null);

    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
      throw logsError;
    }

    console.log(`📊 Encontrados ${emailLogs?.length || 0} logs para sincronizar`);

    if (!emailLogs || emailLogs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum email para sincronizar',
          synced: 0,
          updated: 0,
          errors: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let synced = 0;
    let updated = 0;
    let errors = 0;

    // Verificar cada email no Resend
    for (const log of emailLogs) {
      try {
        const resendMessageId = log.metadata?.resend_message_id;
        if (!resendMessageId) {
          console.log('⚠️  Log sem resend_message_id:', log.id);
          continue;
        }

        // Chamar API do Resend para obter status do email
        const resendResponse = await fetch(
          `https://api.resend.com/emails/${resendMessageId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        synced++;

        if (!resendResponse.ok) {
          console.error(`❌ Erro ao buscar email ${resendMessageId}:`, resendResponse.status);
          errors++;
          continue;
        }

        const resendData = await resendResponse.json();
        console.log(`📧 Status do email ${log.lead_email}:`, resendData.last_event || resendData.status);

        // Mapear status do Resend para nosso status
        let newStatus = log.status;
        const lastEvent = resendData.last_event;

        if (lastEvent === 'delivered' || resendData.status === 'delivered') {
          newStatus = 'delivered';
        } else if (lastEvent === 'bounced' || resendData.status === 'bounced') {
          newStatus = 'failed';
        } else if (lastEvent === 'opened') {
          newStatus = 'opened';
        } else if (lastEvent === 'clicked') {
          newStatus = 'clicked';
        } else if (lastEvent === 'sent' || resendData.status === 'sent') {
          newStatus = 'success';
        }

        // Atualizar apenas se o status mudou
        if (newStatus !== log.status) {
          const { error: updateError } = await supabase
            .from('email_logs')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
              metadata: {
                ...log.metadata,
                resend_status: resendData.status,
                resend_last_event: resendData.last_event,
                resend_synced_at: new Date().toISOString(),
                resend_data: resendData
              }
            })
            .eq('id', log.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar log:', updateError);
            errors++;
          } else {
            console.log(`✅ Status atualizado: ${log.status} → ${newStatus}`);
            updated++;
          }
        } else {
          console.log(`ℹ️  Status já está correto: ${newStatus}`);
        }

      } catch (error: any) {
        console.error('❌ Erro ao processar log:', log.id, error.message);
        errors++;
      }
    }

    console.log(`✅ Sincronização concluída: ${synced} verificados, ${updated} atualizados, ${errors} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída`,
        synced,
        updated,
        errors,
        total: emailLogs.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);
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
