import { Instagram, Youtube } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-warm bg-clip-text text-transparent">ReUNE</h3>
            <p className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Organize eventos sem caos, com ajuda de IA.
            </p>
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
        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          © {currentYear} ReUNE. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};
