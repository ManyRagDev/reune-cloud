import { Instagram, Youtube } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">ReUNE</h3>
            <p className="text-sm text-muted-foreground">Organize eventos sem caos, com ajuda de IA.</p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/status" className="text-muted-foreground hover:text-foreground transition-colors">
                  Status do Sistema
                </a>
              </li>
              <li>
                <a href="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Changelog
                </a>
              </li>
              <li>
                <a href="/presskit" className="text-muted-foreground hover:text-foreground transition-colors">
                  Press Kit
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm mb-4">
              <li>
                <a
                  href="mailto:contato@reuneapp.com.br"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  contato@reuneapp.com.br
                </a>
              </li>
            </ul>

            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-card hover:bg-primary/10 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-card hover:bg-primary/10 flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t space-y-3">
          {/* Continuous Improvement Badge */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-medium">Em constante evolução</span>
            </div>
            <span className="text-muted-foreground">
              Nossa IA está sendo aprimorada continuamente
            </span>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            © {currentYear} ReUNE. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};
