import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="py-24 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange via-primary to-gold opacity-90" />
            
            {/* Content */}
            <div className="relative z-10 text-center py-20 px-6 text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Pronto para o seu próximo evento?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Comece grátis agora e veja como a IA simplifica tudo.
              </p>
              
              <Button
  size="lg"
  onClick={() => navigate("/app")}
  className="bg-white text-gray-900 hover:bg-white/90 dark:bg-gray-900 dark:text-white shadow-floating group"
>
  Começar agora — grátis
  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
</Button>
</div>
          

            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t lg:hidden z-50">
        <Button
          size="lg"
          onClick={() => navigate("/app")}
          className="w-full group"
        >
          Começar agora — grátis
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </>
  );
};
