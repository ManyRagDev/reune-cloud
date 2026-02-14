import { Instagram, Youtube } from "lucide-react";
import { NBLight, NBPalette, nb } from "@/lib/neobrutalism";

interface FooterProps {
  palette?: NBPalette;
}

export const Footer = ({ palette }: FooterProps) => {
  const C = palette || NBLight;
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`py-12 px-4 md:px-8 transition-colors duration-300 ${nb.border} border-x-0 border-b-0`}
      style={{ backgroundColor: C.sectionBg, color: C.text }}
    >
      <div className="container max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div
              className={`inline-block px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} font-black text-xl`}
              style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
            >
              ReUNE
            </div>
            <p className="text-sm font-medium" style={{ color: C.textMuted }}>
              Organize eventos sem caos, com ajuda de IA.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-black mb-4 text-lg">Legal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li>
                <a href="/termos" className="hover:underline opacity-80 hover:opacity-100">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="/privacidade" className="hover:underline opacity-80 hover:opacity-100">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-black mb-4 text-lg">Recursos</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li>
                <a href="/status" className="hover:underline opacity-80 hover:opacity-100">
                  Status do Sistema
                </a>
              </li>
              <li>
                <a href="/presskit" className="hover:underline opacity-80 hover:opacity-100">
                  Press Kit
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-black mb-4 text-lg">Contato</h4>
            <ul className="space-y-3 text-sm font-medium mb-4">
              <li>
                <a
                  href="mailto:contato@reuneapp.com.br"
                  className="hover:underline opacity-80 hover:opacity-100"
                >
                  contato@reuneapp.com.br
                </a>
              </li>
            </ul>

            <div className="flex gap-3">
              {[
                { icon: Instagram, href: "https://instagram.com" },
                { icon: Youtube, href: "https://youtube.com" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} flex items-center justify-center transition-all`}
                  style={{ backgroundColor: C.cardBg, color: C.text }}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`pt-8 border-t-2 border-dashed border-black/10`}
          style={{ borderColor: C.border }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-bold opacity-60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: C.green }}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3`} style={{ backgroundColor: C.green }}></span>
              </span>
              <span>Em constante evolução</span>
            </div>

            <div>
              © {currentYear} ReUNE. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
