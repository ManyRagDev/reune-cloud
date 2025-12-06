import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowLeft, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-3xl"
      />

      {/* 404 Content */}
      <div className="text-center relative z-10 max-w-2xl mx-auto">
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-30 animate-pulse" />
            <h1 className="relative text-[12rem] md:text-[16rem] font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent leading-none">
              404
            </h1>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <Badge className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400">
            <Search className="w-4 h-4 mr-2 inline" />
            Página Não Encontrada
          </Badge>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 space-y-3"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ops! Parece que você se perdeu
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            A página que você está procurando não existe ou foi movida.
          </p>
        </motion.div>

        {/* Path Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10"
        >
          <div className="inline-block px-6 py-3 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/50">
            <code className="text-sm font-mono text-muted-foreground">
              {location.pathname}
            </code>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            size="lg"
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-14 px-8 text-base font-semibold border-2 hover:bg-background/80 backdrop-blur-sm group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </Button>

          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all group"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir para Home
            <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
          </Button>
        </motion.div>

        {/* Fun Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <p className="text-sm text-muted-foreground italic">
            "Nem todos aqueles que vagam estão perdidos... mas você está!" 😅
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
