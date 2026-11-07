import { useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AdminFloatingButton = () => {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  // Se não for admin, ou se já estiver na página de admin, não renderiza nada
  if (!isAdmin || location.pathname === "/admin") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-5 left-5 z-50"
      >
        <button
          onClick={() => navigate("/admin")}
          aria-label="Abrir Painel Administrativo"
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-950/90 hover:bg-slate-900 text-white border border-amber-500/50 shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 hover:border-amber-400"
        >
          {/* Indicador pulsante */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>

          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>

          <span className="text-xs font-black tracking-wide uppercase text-amber-300 flex items-center gap-1">
            Admin
            <span className="hidden sm:inline font-bold text-[11px] text-white/80 lowercase">
              • painel
            </span>
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
