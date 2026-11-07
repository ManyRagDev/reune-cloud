import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackPageView, trackEvent, analytics, GA_MEASUREMENT_ID } from "@/lib/analytics";

describe("Analytics Utility (GA4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.gtag = vi.fn();
  });

  it("deve disparar page_view com o caminho e ID de medição corretos", () => {
    trackPageView("/amigo-secreto", "Amigo Secreto ReUNE");

    expect(window.gtag).toHaveBeenCalledWith("event", "page_view", {
      page_path: "/amigo-secreto",
      page_title: "Amigo Secreto ReUNE",
      page_location: window.location.href,
      send_to: GA_MEASUREMENT_ID,
    });
  });

  it("deve disparar evento customizado trackEvent", () => {
    trackEvent("custom_action", {
      category: "engagement",
      label: "teste_label",
      value: 10,
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "custom_action", {
      event_category: "engagement",
      event_label: "teste_label",
      value: 10,
    });
  });

  it("deve disparar evento de seleção de modo de amigo secreto", () => {
    analytics.secretSanta.selectMode("quick");

    expect(window.gtag).toHaveBeenCalledWith("event", "secret_santa_select_mode", {
      event_category: "conversion",
      event_label: "Sorteador Relâmpago",
      mode: "quick",
    });
  });

  it("deve disparar evento de sorteio relâmpago concluído com contagem de participantes", () => {
    analytics.secretSanta.drawCompleted(7);

    expect(window.gtag).toHaveBeenCalledWith("event", "secret_santa_draw_completed", {
      event_category: "conversion",
      event_label: "7 participantes",
      value: 7,
    });
  });

  it("deve disparar evento de compartilhamento no WhatsApp", () => {
    analytics.secretSanta.shareWhatsApp("quick_individual");

    expect(window.gtag).toHaveBeenCalledWith("event", "secret_santa_whatsapp_share", {
      event_category: "conversion",
      event_label: "quick_individual",
      share_type: "quick_individual",
    });
  });

  it("deve disparar evento de criação sem cadastro (LGPD safe)", () => {
    analytics.secretSanta.quickDrawCreated({
      participantsCount: 8,
      title: "Amigos da Firma",
      drawId: "draw-123-uuid",
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "amigo_secreto_sem_cadastro_criado", {
      event_category: "conversion",
      event_label: "8 participantes",
      value: 8,
      participants_count: 8,
      group_title: "Amigos da Firma",
      draw_id: "draw-123-uuid",
      method: "sem_cadastro",
    });
  });
});
