import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

interface ResendWebhookEvent {
  type: string; // 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.opened' | 'email.clicked'
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Campos específicos por tipo de evento
    clicked_link?: string;
    bounce_type?: string;
    error_message?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Webhook Resend recebido');

    const event: ResendWebhookEvent = await req.json();
    console.log('📋 Tipo de evento:', event.type);
    console.log('📧 Email ID:', event.data.email_id);
    console.log('👤 Destinatário:', event.data.to[0]);

    // Inicializar Supabase com Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar o log correspondente pelo resend_message_id
    const { data: existingLog, error: searchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('metadata->>resend_message_id', event.data.email_id)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar log:', searchError);
      throw searchError;
    }

    // Mapear tipo de evento para status
    let newStatus = 'pending';
    let errorMessage = null;

    switch (event.type) {
      case 'email.sent':
        newStatus = 'success';
        console.log('✅ Email enviado com sucesso');
        break;
      case 'email.delivered':
        newStatus = 'delivered';
        console.log('📬 Email entregue');
        break;
      case 'email.bounced':
        newStatus = 'failed';
        errorMessage = event.data.error_message || `Bounce: ${event.data.bounce_type || 'unknown'}`;
        console.log('❌ Email rejeitado:', errorMessage);
        break;
      case 'email.opened':
        newStatus = 'opened';
        console.log('👀 Email aberto');
        break;
      case 'email.clicked':
        newStatus = 'clicked';
        console.log('🔗 Link clicado:', event.data.clicked_link);
        break;
    }

    if (existingLog) {
      // Atualizar log existente
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      // Adicionar eventos ao metadata
      const currentMetadata = existingLog.metadata || {};
      const events = currentMetadata.events || [];
      events.push({
        type: event.type,
        timestamp: event.created_at,
        data: event.data
      });

      updateData.metadata = {
        ...currentMetadata,
        events,
        last_event: event.type,
        last_event_at: event.created_at
      };

      const { error: updateError } = await supabase
        .from('email_logs')
        .update(updateData)
        .eq('id', existingLog.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar log:', updateError);
        throw updateError;
      }

      console.log('✅ Log atualizado:', existingLog.id);
    } else {
      // Log não encontrado - criar novo (pode acontecer se o webhook chegar antes do log ser criado)
      console.log('⚠️  Log não encontrado, criando novo...');

      const { error: insertError } = await supabase
        .from('email_logs')
        .insert({
          lead_email: event.data.to[0],
          template_name: 'unknown', // Não temos essa info no webhook
          status: newStatus,
          error_message: errorMessage,
          sent_at: event.data.created_at,
          metadata: {
            resend_message_id: event.data.email_id,
            from: event.data.from,
            subject: event.data.subject,
            source: 'webhook',
            events: [{
              type: event.type,
              timestamp: event.created_at,
              data: event.data
            }]
          }
        });

      if (insertError) {
        console.error('❌ Erro ao criar log:', insertError);
        throw insertError;
      }

      console.log('✅ Novo log criado via webhook');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processado com sucesso' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);
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
