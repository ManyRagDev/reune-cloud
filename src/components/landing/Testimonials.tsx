import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Juliana S.",
    location: "São Paulo",
    avatar: "👩‍💼",
    text: "Antes era um caos combinar o que cada um levava. Agora o ReUNE faz tudo!",
    rating: 5,
  },
  {
    name: "Lucas R.",
    location: "Belo Horizonte",
    avatar: "👨‍💻",
    text: "A IA sugere até quantidades. Economizamos e nunca falta nada.",
    rating: 5,
  },
  {
    name: "Carla T.",
    location: "Curitiba",
    avatar: "👩‍🎨",
    text: "Os lembretes automáticos salvaram meu churrasco.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Histórias de quem já usa o ReUNE
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                ))}
              </div>

              <p className="text-lg mb-6 leading-relaxed">"{testimonial.text}"</p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-warm flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-muted-foreground">
          {/*<p className="text-lg">
            Mais de <span className="font-semibold text-foreground">1.000 eventos</span> organizados com sucesso
          </p>*/}
        </div>
      </div>
    </section>
  );
};
