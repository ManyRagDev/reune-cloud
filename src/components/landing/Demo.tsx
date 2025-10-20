import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export const Demo = () => {
  return (
    <section id="demo" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">Veja o ReUNE em ação</h2>
          <p className="text-xl text-muted-foreground">
            Assista a uma demonstração rápida mostrando como a IA organiza seu evento.
          </p>
        </div>

        <div className="relative rounded-3xl overflow-hidden shadow-floating bg-gradient-to-br from-teal to-cyan aspect-video flex items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-10 h-10 text-primary ml-1" />
            </div>
            <span className="text-white text-lg font-medium">
              Demonstração - 30 segundos
            </span>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 text-white/10 text-9xl">▶</div>
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Explorar demo guiada
          </Button>
        </div>
      </div>
    </section>
  );
};
