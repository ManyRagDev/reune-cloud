import { Button } from "@/components/ui/button";
import { ArrowRight, Beef, Cake, Users, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";

const templates = [
  {
    icon: Beef,
    title: "Churrasco de amigos",
    description: "Lista completa para o churrasco perfeito",
    slug: "churrasco",
  },
  {
    icon: Utensils,
    title: "Jantar em família",
    description: "Tudo para uma refeição especial",
    slug: "jantar",
  },
  {
    icon: Cake,
    title: "Aniversário simples",
    description: "Celebre sem estresse",
    slug: "aniversario",
  },
  {
    icon: Users,
    title: "Reunião de equipe",
    description: "Coffee break e snacks profissionais",
    slug: "reuniao",
  },
];

export const Templates = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">Inspire-se com modelos prontos</h2>
          <p className="text-xl text-muted-foreground">
            Use templates criados pela IA e comece seu evento em segundos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-2 animate-fade-in text-center flex flex-col items-center"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto"
                style={{
                  background: 'linear-gradient(135deg, hsl(16 100% 57%), hsl(45 100% 51%))'
                }}
              >
                <template.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-center">{template.title}</h3>
              <p className="text-muted-foreground text-sm mb-6 text-center flex-1">
                {template.description}
              </p>

              <Button
                variant="ghost"
                className="w-full group/btn"
                onClick={() => navigate(`/app?template=${template.slug}`)}
              >
                Usar no ReUNE
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
