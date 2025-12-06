import { Calendar, Sparkles, Users, ListTodo, CheckCircle2, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

const stepsWithAI = [
  {
    number: "01",
    icon: Sparkles,
    title: "Descreva seu evento",
    description: "Diga para a IA o que você quer: 'Churrasco para 20 pessoas no sábado à tarde'.",
  },
  {
    number: "02",
    icon: Calendar,
    title: "IA cria tudo",
    description: "A IA define data, local, cria a lista de compras e calcula quantidades ideais.",
  },
  {
    number: "03",
    icon: Users,
    title: "Convide e confirme",
    description: "Receba o link pronto para enviar aos convidados e gerenciar confirmações.",
  },
];

const stepsWithoutAI = [
  {
    number: "01",
    icon: ListTodo,
    title: "Monte sua lista",
    description: "Crie sua lista de itens manualmente, com total controle do que precisa.",
  },
  {
    number: "02",
    icon: Share2,
    title: "Compartilhe",
    description: "Envie o convite personalizado para seus amigos via WhatsApp.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Gerencie tudo",
    description: "Acompanhe confirmações e quem ficou responsável por cada item em tempo real.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">Como funciona</h2>
          <p className="text-xl text-muted-foreground">
            Escolha como você prefere organizar seu evento
          </p>
        </div>

        <Tabs defaultValue="with-ai" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-14 p-1 bg-background/50 backdrop-blur-sm border shadow-sm rounded-full">
              <TabsTrigger
                value="with-ai"
                className="rounded-full h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300 group"
              >
                <Sparkles className="w-4 h-4 mr-2 group-data-[state=active]:animate-pulse group-hover:rotate-12 transition-transform" />
                Com IA
              </TabsTrigger>
              <TabsTrigger
                value="without-ai"
                className="rounded-full h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300 group"
              >
                <ListTodo className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Manual
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="with-ai" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid md:grid-cols-3 gap-8"
            >
              {stepsWithAI.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-2 h-full border border-border/50">
                    <div className="absolute top-4 right-4 text-6xl font-bold text-muted-foreground/5">
                      {step.number}
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-warm flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                        <step.icon className="w-7 h-7 text-white" />
                      </div>

                      <h3 className="text-2xl font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Connector line (desktop only) */}
                  {index < stepsWithAI.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="without-ai" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid md:grid-cols-3 gap-8"
            >
              {stepsWithoutAI.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-2 h-full border border-border/50">
                    <div className="absolute top-4 right-4 text-6xl font-bold text-muted-foreground/5">
                      {step.number}
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20 group-hover:scale-110 transition-transform duration-300">
                        <step.icon className="w-7 h-7 text-secondary-foreground" />
                      </div>

                      <h3 className="text-2xl font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Connector line (desktop only) */}
                  {index < stepsWithoutAI.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-secondary/30 to-transparent" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
