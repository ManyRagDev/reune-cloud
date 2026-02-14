import { Heart, Instagram, Twitter, MessageCircle } from 'lucide-react';

const footerLinks = {
  produto: [
    { label: 'Como funciona', href: '#como-funciona' },
    { label: 'Preços', href: '#precos' },
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Roadmap', href: '#roadmap' },
  ],
  empresa: [
    { label: 'Sobre nós', href: '#sobre' },
    { label: 'Blog', href: '#blog' },
    { label: 'Carreiras', href: '#carreiras' },
    { label: 'Contato', href: '#contato' },
  ],
  suporte: [
    { label: 'Central de ajuda', href: '#ajuda' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Termos de uso', href: '#termos' },
    { label: 'Privacidade', href: '#privacidade' },
  ],
};

const socialLinks = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: MessageCircle, href: '#', label: 'WhatsApp' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <span className="text-xl font-bold">R</span>
              </div>
              <span className="text-2xl font-bold">ReUNE</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
              Organize eventos sociais sem estresse. 
              Do café da manhã ao churrasco, 
              a gente cuida da parte chata.
            </p>
            
            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © {new Date().getFullYear()} ReUNE. Feito com{' '}
              <Heart className="w-4 h-4 inline text-red-500 fill-red-500" />{' '}
              no Brasil.
            </p>
            <p className="text-gray-600 text-sm">
              Organize mais, estresse menos.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
