import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Calendar,
  ShoppingCart,
  Car,
  Music,
  Store,
  Mail,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const integrations = [
  { name: "WhatsApp", icon: MessageCircle },
  { name: "Google Calendar", icon: Calendar },
  { name: "iFood", icon: ShoppingCart },
  { name: "Uber", icon: Car },
  { name: "Spotify", icon: Music },
  { name: "Negócios Locais", icon: Store },
  { name: "Gmail", icon: Mail },
  { name: "Google Maps", icon: MapPin },
];

export const Integrations = () => {
  const { toast } = useToast();

  const handleRoadmapClick = () => {
    toast({
      title: "Em breve",
      description: "Em breve estará disponível",
    });
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">
            Conectado ao seu mundo
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            O ReUNE foi desenhado para trabalhar em harmonia com os apps que você já ama.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Glassmorphism Container */}
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl p-8 md:p-12 text-center shadow-2xl">

            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50" />

            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Em breve
              </div>

              <h3 className="text-2xl font-semibold">
                Um ecossistema completo de integrações
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full max-w-3xl">
                {integrations.map((item, index) => (
                  <div
                    key={index}
                    className="group flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-primary/50 group-hover:shadow-md">
                      <item.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground max-w-lg">
                Estamos trabalhando duro para trazer essas conexões. Você poderá chamar transporte, pedir comida e criar playlists sem sair do evento.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" className="gap-2" onClick={handleRoadmapClick}>
            Ver roadmap completo
          </Button>
        </div>
      </div>
    </section>
  );
};
