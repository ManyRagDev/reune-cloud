import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

const ReuneWaitlist = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@") || !email.includes(".")) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("waitlist_reune")
        .insert([{ email: email.toLowerCase().trim() }]);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Você já está na lista!",
            description: "Esse email já foi cadastrado.",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        setEmail("");
        toast({
          title: "Você está na lista! 🎉",
          description: "Fique de olho no lançamento.",
        });
      }
    } catch (error) {
      console.error("Error submitting to waitlist:", error);
      toast({
        title: "Erro ao cadastrar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          {/* Hero Section */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
            >
              Organizar eventos entre amigos{" "}
              <span className="text-orange-600 dark:text-orange-400">
                nunca deveria ser um caos.
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300"
            >
              É por isso que o ReUNE está chegando.
            </motion.p>
          </div>

          {/* Waitlist Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl border border-orange-100 dark:border-gray-700 space-y-6"
          >
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Em breve, organizar encontros e eventos vai ser simples, colaborativo e leve.{" "}
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                Faça parte da lista de espera
              </span>{" "}
              e receba o acesso antecipado.
            </p>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  disabled={isSubmitting}
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 px-8 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-semibold"
                >
                  {isSubmitting ? "Enviando..." : "Quero entrar"}
                </Button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800"
              >
                <p className="text-green-800 dark:text-green-300 text-lg font-medium">
                  ✓ Você está na lista! Fique de olho no lançamento 🎉
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="space-y-4 pt-8"
          >
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-6xl"
            >
              🍻
            </motion.div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Feito com leveza e propósito para quem já viveu o caos dos grupos de WhatsApp.
            </p>
            
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              © 2025 ReUNE
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReuneWaitlist;