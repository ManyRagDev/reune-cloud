/**
 * Google Analytics 4 (GA4) Analytics Utility
 * ID de Medição: G-KKX5FSRGFP
 */

export const GA_MEASUREMENT_ID = "G-KKX5FSRGFP";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Envia visualização de página no GA4 para navegação em SPA
 */
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
      send_to: GA_MEASUREMENT_ID,
    });
  }
};

/**
 * Envia um evento genérico customizado para o GA4
 */
export const trackEvent = (
  action: string,
  params: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  } = {}
) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    const { category, label, value, ...rest } = params;
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
      ...rest,
    });
  }
};

/**
 * Atalhos para eventos-chave de conversão do ReUNE e Amigo Secreto
 */
export const analytics = {
  pageView: trackPageView,
  event: trackEvent,

  // Amigo Secreto
  secretSanta: {
    // Escolha no Modal inicial
    selectMode: (mode: "quick" | "full") => {
      trackEvent("secret_santa_select_mode", {
        category: "conversion",
        label: mode === "quick" ? "Sorteador Relâmpago" : "Suíte Completa",
        mode,
      });
    },

    // Abertura do modal de escolha
    openChoiceModal: (source: string) => {
      trackEvent("secret_santa_open_choice_modal", {
        category: "engagement",
        label: source,
      });
    },

    // Realização do sorteio relâmpago
    drawCompleted: (participantsCount: number) => {
      trackEvent("secret_santa_draw_completed", {
        category: "conversion",
        label: `${participantsCount} participantes`,
        value: participantsCount,
      });
    },

    // Clique para compartilhar no WhatsApp
    shareWhatsApp: (type: "quick_individual" | "group_link" | "envelope") => {
      trackEvent("secret_santa_whatsapp_share", {
        category: "conversion",
        label: type,
        share_type: type,
      });
    },

    // Abertura do envelope lacrado
    envelopeOpened: (isOwner: boolean) => {
      trackEvent("secret_santa_envelope_opened", {
        category: "engagement",
        label: isOwner ? "Destinatário Legítimo" : "Lacre Violado / Terceiro",
      });
    },
  },

  // ReUNE Geral / Landing
  reune: {
    ctaClick: (ctaName: string, location: string) => {
      trackEvent("reune_cta_click", {
        category: "conversion",
        label: ctaName,
        location,
      });
    },
  },
};
