import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    email?: string;
    created_at?: string;
    display_name?: string;
    username?: string;
    phone?: string;
    [key: string]: unknown;
  };
  userId?: string;
  id?: string;
  test?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID") || "1026643513";

    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN não foi configurado nas variáveis de ambiente.");
      return new Response(
        JSON.stringify({ error: "TELEGRAM_BOT_TOKEN não configurado no Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: WebhookPayload = await req.json().catch(() => ({}));

    // Modo de Teste
    if (payload.test === true) {
      const nowStr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const testMessage = [
        "🚀 <b>ReUNE - Teste de Notificação Telegram</b>",
        "",
        "✅ <b>Status:</b> Conexão bem-sucedida!",
        `⏰ <b>Data/Hora:</b> ${nowStr}`,
        "",
        "🤖 O bot está configurado e pronto para alertar a cada novo cadastro!",
      ].join("\n");

      const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: testMessage,
          parse_mode: "HTML",
        }),
      });

      const tgResult = await tgResponse.json();
      if (!tgResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Erro ao enviar teste para o Telegram", details: tgResult }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Mensagem de teste enviada com sucesso!", tgResult }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Identificar ID do usuário recém-criado
    const userId = payload.record?.id || payload.userId || payload.id;

    let email = payload.record?.email || "Email não identificado";
    let name = payload.record?.display_name || payload.record?.username || "Novo Usuário";
    let provider = "email";
    let createdAt = payload.record?.created_at || new Date().toISOString();
    let phone = payload.record?.phone || null;

    // Se temos um ID de usuário, buscar dados completos em auth.users via Supabase Admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (userId && supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (!userError && userData?.user) {
          const u = userData.user;
          if (u.email) email = u.email;
          if (u.phone) phone = u.phone;
          
          const meta = u.user_metadata || {};
          const metaName = meta.full_name || meta.name || meta.display_name;
          if (metaName) name = metaName;

          if (u.app_metadata?.provider) {
            provider = u.app_metadata.provider;
          }
          if (u.created_at) {
            createdAt = u.created_at;
          }
        }
      } catch (err) {
        console.warn("Aviso ao buscar dados em auth.users:", err);
      }
    }

    // Formatar data para horário de Brasília (UTC-3)
    const formattedDate = new Date(createdAt).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const lines = [
      "🎉 <b>Novo Usuário Cadastrado no ReUNE!</b>",
      "",
      `👤 <b>Nome:</b> ${escapeHtml(name)}`,
      `📧 <b>Email:</b> ${escapeHtml(email)}`,
    ];

    if (phone) {
      lines.push(`📱 <b>Telefone:</b> ${escapeHtml(phone)}`);
    }

    lines.push(`🌐 <b>Método:</b> ${escapeHtml(provider)}`);
    lines.push(`⏰ <b>Data/Hora:</b> ${formattedDate}`);

    if (userId) {
      lines.push(`🆔 <b>ID:</b> <code>${userId}</code>`);
    }

    const messageText = lines.join("\n");

    const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const tgData = await tgResponse.json();

    if (!tgResponse.ok) {
      console.error("Erro retornado pela API do Telegram:", tgData);
      return new Response(
        JSON.stringify({ error: "Erro na API do Telegram", details: tgData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notificação enviada com sucesso ao Telegram!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro inesperado na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
