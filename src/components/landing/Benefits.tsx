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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-cool flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <benefit.icon className="w-6 h-6 text-white" />
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
