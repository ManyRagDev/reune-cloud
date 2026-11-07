import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Componente invisível que escuta as mudanças de rota do React Router
 * e dispara eventos `page_view` para o Google Analytics 4 (GA4).
 */
export const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    trackPageView(fullPath);
  }, [location.pathname, location.search]);

  return null;
};
