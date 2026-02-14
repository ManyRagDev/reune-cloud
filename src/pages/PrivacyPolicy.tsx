import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { NBLight, nb } from "@/lib/neobrutalism";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const C = NBLight;

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: C.bg, color: C.text }}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 px-4 py-3 ${nb.border} border-t-0 border-x-0`}
        style={{ backgroundColor: C.bg }}
      >
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className={`px-3 py-1 rounded-lg ${nb.border} ${nb.shadow} font-black text-lg`} style={{ backgroundColor: C.orange, color: "#FFFDF7" }}>
            ReUNE
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className={`hover:bg-transparent hover:underline font-bold`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao site
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Política de Privacidade
          </h1>
          <p className="font-medium opacity-60">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div
          className={`p-8 md:p-12 rounded-2xl ${nb.border} ${nb.shadowLg}`}
          style={{ backgroundColor: C.cardBg }}
        >
          <div className="prose prose-neutral max-w-none font-medium">
            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>1. Informações que Coletamos</h2>
              <p className="mb-4">
                O ReUNE coleta as seguintes informações para proporcionar a melhor experiência possível:
              </p>

              <h3 className="text-xl font-bold mb-3 mt-6">1.1 Informações Fornecidas por Você</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Dados de Cadastro:</strong> Nome, e-mail, telefone e foto de perfil</li>
                <li><strong>Informações de Eventos:</strong> Título, descrição, data, local e participantes dos eventos criados</li>
                <li><strong>Conteúdo Gerado:</strong> Mensagens, comentários, fotos e demais interações no aplicativo</li>
                <li><strong>Lista de Contatos:</strong> Com sua permissão, para facilitar o convite de amigos</li>
              </ul>

              <h3 className="text-xl font-bold mb-3 mt-6">1.2 Informações Coletadas Automaticamente</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dados de Uso:</strong> Interações com o app, eventos acessados, funcionalidades utilizadas</li>
                <li><strong>Informações do Dispositivo:</strong> Modelo, sistema operacional, identificador único, endereço IP</li>
                <li><strong>Cookies e Tecnologias Similares:</strong> Para melhorar a experiência e autenticação</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>2. Como Usamos Suas Informações</h2>
              <p className="mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer, manter e melhorar nossos serviços</li>
                <li>Facilitar a criação e gestão de eventos</li>
                <li>Conectar você com seus amigos e participantes de eventos</li>
                <li>Enviar notificações sobre eventos, convites e atualizações</li>
                <li>Personalizar sua experiência no aplicativo</li>
                <li>Garantir a segurança e prevenir fraudes</li>
                <li>Analisar o uso do app para melhorias contínuas</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>3. Compartilhamento de Informações</h2>
              <p className="mb-4">
                Nós <strong>NÃO vendemos</strong> suas informações pessoais. Compartilhamos dados apenas quando:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Com Outros Usuários:</strong> Informações de perfil e eventos são visíveis para participantes convidados</li>
                <li><strong>Prestadores de Serviços:</strong> Empresas que nos auxiliam (hospedagem, email, analytics) sob rigorosos termos de confidencialidade</li>
                <li><strong>Exigências Legais:</strong> Quando necessário para cumprir leis, regulamentos ou ordens judiciais</li>
                <li><strong>Proteção de Direitos:</strong> Para proteger direitos, segurança e propriedade do ReUNE e seus usuários</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>4. Seus Direitos (LGPD)</h2>
              <p className="mb-4">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> De dados desnecessários ou excessivos</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Informação sobre Compartilhamento:</strong> Saber com quem compartilhamos seus dados</li>
                <li><strong>Revogação do Consentimento:</strong> A qualquer momento</li>
                <li><strong>Oposição ao Tratamento:</strong> Quando não houver consentimento ou base legal</li>
              </ul>
              <p className="mt-4">
                Para exercer seus direitos, entre em contato pelo email: <strong>contato@reuneapp.com.br</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações
                contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Auditorias regulares de segurança</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>6. Retenção de Dados</h2>
              <p>
                Mantemos suas informações pelo tempo necessário para fornecer nossos serviços,
                cumprir obrigações legais, resolver disputas e fazer cumprir nossos acordos.
                Quando você excluir sua conta, seus dados serão removidos dentro de 90 dias,
                exceto quando precisarmos mantê-los por obrigação legal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>7. Menores de Idade</h2>
              <p>
                O ReUNE não é destinado a menores de 13 anos. Não coletamos intencionalmente
                informações de crianças. Se você acredita que uma criança nos forneceu dados pessoais,
                entre em contato para que possamos removê-los.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>8. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre
                mudanças significativas por email ou aviso no aplicativo. O uso continuado após as
                alterações constitui aceitação da nova política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black mb-4" style={{ color: C.black }}>9. Contato</h2>
              <p className="mb-4">
                Para dúvidas, solicitações ou reclamações sobre privacidade:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> contato@reuneapp.com.br</li>

              </ul>
              <div
                className={`mt-6 p-4 rounded-xl ${nb.border}`}
                style={{ backgroundColor: C.sectionBg }}
              >
                <p className="text-sm">
                  Você também pode registrar uma reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD).
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer palette={C} />
    </div>
  );
}
