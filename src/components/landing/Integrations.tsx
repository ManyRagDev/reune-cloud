import { Button } from "@/components/ui/button";
import { Calendar, FileSpreadsheet, MessageCircle } from "lucide-react";

const integrations = [
  { name: "WhatsApp", icon: MessageCircle, status: "active" },
  { name: "Google Calendar", icon: Calendar, status: "active" },
  { name: "Planilhas", icon: FileSpreadsheet, status: "active" },
  { name: "Google Chat", icon: MessageCircle, status: "soon" },
  { name: "Slack", icon: MessageCircle, status: "soon" },
];

export const Integrations = () => {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Integrações que facilitam sua vida
          </h2>
          <p className="text-xl text-muted-foreground">
            Conecte o ReUNE às ferramentas que você já usa.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 w-40">
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${
                    integration.status === "active" 
                      ? "bg-gradient-cool" 
                      : "bg-muted"
                  } flex items-center justify-center`}>
                    <integration.icon className={`w-6 h-6 ${
                      integration.status === "active" 
                        ? "text-white" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-center">
                    {integration.name}
                  </span>
                  {integration.status === "soon" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      Em breve
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline">Ver todas as integrações</Button>
        </div>
      </div>
    </section>
  );
};
