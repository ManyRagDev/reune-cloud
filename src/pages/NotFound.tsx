import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Home } from "lucide-react";
import { motion } from "framer-motion";
import { NBLight, nb } from "@/lib/neobrutalism";

const NotFound = () => {
  const navigate = useNavigate();
  const C = NBLight; // Force light or add theme logic if needed

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: C.bg }}
    >
      {/* Background geometric shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute top-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full ${nb.border} opacity-20`}
        style={{ backgroundColor: C.yellow }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] ${nb.border} opacity-20`}
        style={{ backgroundColor: C.pink }}
      />

      <div className="text-center relative z-10 max-w-2xl mx-auto space-y-8">
        {/* 404 Visual */}
        <div className="relative inline-block">
          <h1
            className="text-[10rem] md:text-[14rem] font-black leading-none select-none"
            style={{
              color: C.orange,
              textShadow: `8px 8px 0px ${C.black}`,
              WebkitTextStroke: "5px #1A1A1A"
            }}
          >
            404
          </h1>
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 rounded-lg ${nb.border} ${nb.shadow} font-black text-xl whitespace-nowrap rotate-[-10deg]`}
            style={{ backgroundColor: C.mint, color: C.black }}
          >
            Ops! Sumiu...
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: C.text }}>
            Não encontramos essa página
          </h2>
          <p className="text-xl font-medium max-w-lg mx-auto" style={{ color: C.textMuted }}>
            Parece que você clicou num link quebrado ou a página foi movida pro limbo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className={`h-14 px-8 text-lg font-bold rounded-xl ${nb.button} bg-white hover:bg-gray-50 flex items-center gap-2`}
            style={{ color: C.text, backgroundColor: C.cardBg }}
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <button
            onClick={() => navigate("/")}
            className={`h-14 px-8 text-lg font-bold rounded-xl ${nb.button} flex items-center gap-2`}
            style={{ backgroundColor: C.yellow, color: C.black }}
          >
            <Home className="w-5 h-5" />
            Ir para o Início
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
