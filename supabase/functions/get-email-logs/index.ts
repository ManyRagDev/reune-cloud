import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogsRequest {
  password: string;
  filters?: {
    lead_id?: string;
    lead_email?: string;
    template_name?: string;
    status?: 'success' | 'failed' | 'pending';
    start_date?: string;
    end_date?: string;
  };
  limit?: number;
  offset?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, filters = {}, limit = 50, offset = 0 }: LogsRequest = await req.json();

    // Validar senha admin
    if (password !== "2025") {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase com Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Construir query com filtros
    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (filters.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }

    if (filters.lead_email) {
      query = query.ilike('lead_email', `%${filters.lead_email}%`);
    }

    if (filters.template_name) {
      query = query.eq('template_name', filters.template_name);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.start_date) {
      query = query.gte('sent_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('sent_at', filters.end_date);
    }

    // Ordenar por mais recentes
    query = query.order('sent_at', { ascending: false });

    // Paginação
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Buscar estatísticas gerais
    const { data: stats } = await supabase
      .from('email_logs')
      .select('status');

    const totalSuccess = stats?.filter(s => s.status === 'success').length || 0;
    const totalFailed = stats?.filter(s => s.status === 'failed').length || 0;
    const totalPending = stats?.filter(s => s.status === 'pending').length || 0;

    return new Response(
      JSON.stringify({
        logs: data,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (count || 0)
        },
        stats: {
          totalSuccess,
          totalFailed,
          totalPending,
          total: (totalSuccess + totalFailed + totalPending)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro ao buscar logs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
