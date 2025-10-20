import { Calendar, Sparkles, Users } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Calendar,
    title: "Crie o evento",
    description: "Defina o tipo, local e data.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "IA sugere a lista",
    description: "A IA UNE.AI recomenda itens e quantidades automaticamente.",
  },
  {
    number: "03",
    icon: Users,
    title: "Convide e confirme",
    description: "Envie convites, veja quem vai e quem leva o quê.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">Como funciona</h2>
          <p className="text-xl text-muted-foreground">
            Em poucos passos, seu evento fica pronto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-2 h-full">
                <div className="absolute top-4 right-4 text-6xl font-bold text-muted-foreground/10">
                  {step.number}
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-warm flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
