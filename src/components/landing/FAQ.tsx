import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O ReUNE é gratuito?",
    answer: "Sim! Você pode usar gratuitamente e criar quantos eventos quiser.",
  },
  {
    question: "O que a IA faz exatamente?",
    answer: "A UNE.AI ajuda a montar a lista de itens, quantidades e lembretes automáticos baseado no tipo de evento que você criar.",
  },
  {
    question: "Preciso baixar o app?",
    answer: "Não. Você pode usar no navegador e, se quiser, instalar o PWA no celular para ter uma experiência similar a um app nativo.",
  },
  {
    question: "Meus dados são seguros?",
    answer: "Sim. Seguimos padrões LGPD e não compartilhamos informações pessoais com terceiros.",
  },
  {
    question: "Funciona offline?",
    answer: "A versão PWA permite acesso limitado mesmo sem conexão, mas você precisará estar online para sincronizar dados.",
  },
  {
    question: "Posso usar no WhatsApp?",
    answer: "Sim. É possível compartilhar convites e listas diretamente pelo WhatsApp com seus convidados.",
  },
  {
    question: "Há versão para empresas?",
    answer: "Está em desenvolvimento e será lançada em breve com recursos adicionais para eventos corporativos.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">Perguntas frequentes</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card rounded-2xl px-6 shadow-soft border-0"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
