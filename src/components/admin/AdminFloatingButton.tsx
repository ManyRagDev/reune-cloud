import { useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { ShieldCheck } from "lucide-react";
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
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        className="fixed top-20 right-4 sm:top-24 sm:right-6 z-[9999] select-none"
      >
        <button
          onClick={() => navigate("/admin")}
          aria-label="Abrir Painel Administrativo"
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-950 text-white border-2 border-amber-400 shadow-[0_8px_30px_rgb(245,158,11,0.35)] backdrop-blur-xl whitespace-nowrap hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {/* Indicador pulsante de status */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>

          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>

          <span className="text-xs font-black tracking-wide uppercase text-amber-300">
            Painel Admin
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
