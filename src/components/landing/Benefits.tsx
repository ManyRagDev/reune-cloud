import { Brain, CheckCircle, DollarSign, FileText, Smartphone } from "lucide-react";

const benefits = [
  {
    icon: Brain,
    title: "Lista inteligente (IA)",
    description: "A UNE.AI entende o tipo de evento e sugere tudo o que você precisa.",
  },
  {
    icon: CheckCircle,
    title: "RSVP inteligente",
    description: "Acompanhe confirmações e lembretes automáticos.",
  },
  {
    icon: DollarSign,
    title: "Divisão de custos",
    description: "O ReUNE estima valores por pessoa em segundos.",
  },
  {
    icon: FileText,
    title: "Templates prontos",
    description: "Crie eventos com listas sugeridas (churrasco, jantar, aniversário…).",
  },
  {
    icon: Smartphone,
    title: "Funciona em qualquer lugar",
    description: "Use no navegador ou instale como app PWA.",
  },
];

export const Benefits = () => {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">Por que usar o ReUNE</h2>
          <p className="text-xl text-muted-foreground">
            Inteligência, praticidade e colaboração em um só lugar.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-in flex flex-col items-center text-center"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-16 h-16 rounded-lg bg-gradient-cool flex items-center justify-center mb-5 group-hover:scale-110 transition-transform mx-auto">
                <benefit.icon className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
