import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, CheckCircle2, ShieldAlert, FileText, Mail, HelpCircle } from "lucide-react";
import { NBLight, nb } from "@/lib/neobrutalism";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
          <div
            className={`px-3 py-1 rounded-lg ${nb.border} ${nb.shadow} font-black text-lg`}
            style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
          >
            ReUNE
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="hover:bg-transparent hover:underline font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao site
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Badge & Header */}
        <div className="mb-10 text-center space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${nb.border} ${nb.shadow} text-xs md:text-sm font-black uppercase tracking-wider`}
            style={{ backgroundColor: C.yellow, color: C.black }}
          >
            <Scale className="w-4 h-4" />
            Marco Civil da Internet & Código Civil Brasileiro
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Termos e Condições de Uso
          </h1>
          <p className="font-semibold text-sm opacity-70">
            Última revisão: {new Date().toLocaleDateString("pt-BR")} • Versão 2.1
          </p>
        </div>

        {/* Content Box */}
        <div
          className={`p-6 md:p-12 rounded-2xl ${nb.border} ${nb.shadowLg}`}
          style={{ backgroundColor: C.cardBg }}
        >
          {/* Summary Box */}
          <div
            className={`p-5 mb-8 rounded-xl ${nb.border} flex flex-col sm:flex-row items-start sm:items-center gap-4`}
            style={{ backgroundColor: C.sectionBg }}
          >
            <div
              className={`p-3 rounded-lg ${nb.border} shrink-0`}
              style={{ backgroundColor: C.mint, color: C.black }}
            >
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm">
              <p className="font-black text-base mb-1">Visão Geral dos Nossos Termos</p>
              <p className="opacity-80 leading-relaxed font-medium">
                O <strong>ReUNE</strong> é uma plataforma tecnológica concebida para simplificar a organização social de eventos,
                reuniões e celebrações entre amigos, combinando orquestração inteligente e sorteador de Amigo Secreto.
                Ao utilizar nossos serviços, você concorda plenamente com estas diretrizes.
              </p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none font-medium text-sm md:text-base leading-relaxed space-y-8">
            {/* 1. Aceitação */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>1.</span> Aceitação dos Termos e Capacidade Civil
              </h2>
              <p>
                Ao acessar, navegar ou criar eventos através do <strong>ReUNE</strong>, você declara ter lido, compreendido e aceito
                integralmente estes Termos de Uso e a nossa <a href="/privacidade" className="underline font-bold">Política de Privacidade & LGPD</a>.
              </p>
              <p className="mt-2">
                Para utilizar o serviço, você declara possuir capacidade civil plena segundo as leis brasileiras (ter 18 anos ou mais)
                ou estar devidamente autorizado e assistido por seus pais ou responsáveis legais, caso tenha entre 13 e 18 anos de idade.
              </p>
            </section>

            {/* 2. Escopo dos Serviços */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>2.</span> Escopo e Funcionalidades da Plataforma
              </h2>
              <p>
                O ReUNE opera como uma ferramenta digital de suporte à gestão e planejamento comunitário. Nossos serviços contemplam:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Criação e Gestão de Eventos:</strong> Planejamento assistido por inteligência artificial (Une.AI) para estimativa de insumos, carnes, bebidas e divisão de tarefas.</li>
                <li><strong>Confirmação de Presença (RSVP):</strong> Convites digitais, gestão de presença e lista colaborativa de participantes.</li>
                <li><strong>Suíte de Amigo Secreto:</strong>
                  <ul className="list-circle pl-6 mt-1 space-y-1 text-sm">
                    <li><em>Sorteador Relâmpago (Sem Cadastro):</em> Sorteio instantâneo e geração de envelopes digitais com verificação de lacre via links diretos.</li>
                    <li><em>Suíte Completa (Com Cadastro):</em> Sorteio com algoritmo justo (derangement), wishlists de presentes e revelação interativa com PIN de 4 dígitos.</li>
                  </ul>
                </li>
              </ul>
            </section>

            {/* 3. Delimitação de Responsabilidade */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>3.</span> Delimitação Crítica de Responsabilidade
              </h2>
              <div
                className={`p-4 rounded-xl ${nb.border} border-l-[6px] mb-4`}
                style={{ backgroundColor: C.pink, borderColor: C.black }}
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-black" />
                  <p className="font-bold text-sm" style={{ color: C.black }}>
                    Aviso Importante: O ReUNE é estritamente uma plataforma digital de software para organização e planejamento.
                  </p>
                </div>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Realização Física dos Eventos:</strong> O ReUNE <strong>não</strong> organiza fisicamente eventos, não fornece alimentação, bebidas ou transporte, e não administra os locais físicos escolhidos pelos usuários. A integridade física, conduta pessoal e conformidade legal do local do evento são de responsabilidade exclusiva dos organizadores e convidados.</li>
                <li><strong>Troca de Presentes:</strong> No Amigo Secreto, o ReUNE garante a imparcialidade algorítmica do sorteio. No entanto, não intermediamos pagamentos, compras, conformidade de produtos ou a entrega efetiva dos presentes acordados entre os amigos.</li>
                <li><strong>Sugestões da IA (Une.AI):</strong> Os cálculos e recomendações gerados pela IA servem como estimativas orientativas. O usuário tem total autonomia para revisar, alterar ou desconsiderar quantidades e itens sugeridos.</li>
              </ul>
            </section>

            {/* 4. Cadastro e Segurança da Conta */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>4.</span> Cadastro, Senhas e Acesso
              </h2>
              <p>
                Ao criar uma conta no ReUNE, você se compromete a:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Fornecer dados cadastrais verdadeiros, exatos e atualizados.</li>
                <li>Zelar pela confidencialidade de sua senha e por qualquer atividade conduzida a partir de suas credenciais.</li>
                <li>Notificar imediatamente o suporte do ReUNE através do e-mail <strong>contato@reuneapp.com.br</strong> caso suspeite de invasão ou uso indevido de sua conta.</li>
              </ul>
            </section>

            {/* 5. Regras de Conduta */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>5.</span> Regras de Conduta e Usos Proibidos
              </h2>
              <p>
                Para preservar um ambiente harmonioso e seguro para todos, é expressamente proibido:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3 text-sm">
                <li>Inserir ou propagar conteúdo discriminatório, preconceituoso, ilícito, calunioso ou ofensivo nos títulos de eventos, murais ou wishlists.</li>
                <li>Praticar assédio, ameaça ou intimidação contra qualquer participante ou convidado.</li>
                <li>Utilizar a plataforma para divulgação de SPAM, correntes, pirâmides ou propaganda comercial não autorizada.</li>
                <li>Empregar robôs, spiders, scrapers ou outros meios automatizados para coletar dados da aplicação sem autorização prévia por escrito.</li>
                <li>Praticar qualquer ato que comprometa a integridade técnica, realize engenharia reversa ou tente burlar autenticações e regras de segurança (RLS) do sistema.</li>
              </ul>
              <p className="mt-3 text-sm opacity-90">
                O descumprimento destas diretrizes autoriza o ReUNE a suspender ou banir preventivamente a conta do infrator, sem prejuízo da apuração de responsabilidades civis e penais cabíveis.
              </p>
            </section>

            {/* 6. Propriedade Intelectual */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>6.</span> Direitos de Propriedade Intelectual
              </h2>
              <p>
                Todo o conteúdo da plataforma — incluindo marcas registradas, logotipos, layout visual neobrutalista, componentes gráficos, código-fonte, banco de dados e arquitetura de software — é de propriedade exclusiva do ReUNE e protegido pelas Leis de Direitos Autorais (Lei nº 9.610/1998) e de Propriedade Industrial (Lei nº 9.279/1996).
              </p>
              <p className="mt-2 text-sm opacity-80">
                É proibida a reprodução, cópia, distribuição, engenharia reversa ou comercialização não autorizada de qualquer recurso do ReUNE.
              </p>
            </section>

            {/* 7. Disponibilidade e Isenção Técnica */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>7.</span> Disponibilidade do Sistema e Manutenções
              </h2>
              <p>
                Nos empenhamos para disponibilizar o ReUNE de maneira contínua, estável e segura. Contudo, em decorrência da natureza inerente da internet, não é possível garantir que o serviço funcionará ininterruptamente ou sem erros acidentais.
              </p>
              <p className="mt-2 text-sm opacity-80">
                Poderão ocorrer paradas programadas para aprimoramento técnico, implementação de novas funcionalidades ou contingências de infraestrutura de nuvem, as quais procuraremos realizar com o menor impacto possível à experiência dos usuários.
              </p>
            </section>

            {/* 8. Rescisão e Encerramento de Conta */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>8.</span> Encerramento de Conta e Exclusão de Dados
              </h2>
              <p>
                Você possui total liberdade para descontinuar o uso da plataforma a qualquer momento e solicitar a exclusão de seus dados e eventos através do canal de atendimento.
              </p>
              <p className="mt-2 text-sm opacity-80">
                Ao excluir a conta, seus dados pessoais serão desvinculados e excluídos, ressalvada a obrigação de manutenção dos registros de conexão por 6 meses nos termos do Marco Civil da Internet.
              </p>
            </section>

            {/* 9. Legislação Aplicável e Foro */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>9.</span> Legislação Aplicável e Foro de Eleição
              </h2>
              <p>
                Estes Termos são regidos e interpretados segundo as Leis da República Federativa do Brasil, em particular o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e o <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong> quando caracterizada a relação de consumo.
              </p>
              <p className="mt-2 text-sm opacity-80">
                Para a resolução de eventuais litígios oriundos do presente instrumento, fica eleito o <strong>Foro da Comarca de São Paulo/SP</strong>, ressalvadas as prerrogativas processuais protetivas do domicílio do consumidor conferidas pela legislação imperativa.
              </p>
            </section>

            {/* 10. Contato e Notificações */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>10.</span> Atendimento e Contato
              </h2>
              <p className="mb-4">
                Dúvidas, sugestões ou comunicações legais sobre estes Termos de Uso devem ser enviadas diretamente à nossa equipe:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:contato@reuneapp.com.br?subject=Termos%20de%20Uso%20ReUNE"
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black text-sm`}
                  style={{ backgroundColor: C.mint, color: C.black }}
                >
                  <Mail className="w-4 h-4" />
                  contato@reuneapp.com.br
                </a>
              </div>
            </section>

            {/* Bottom Agreement Banner */}
            <div
              className={`mt-8 p-6 rounded-xl border-l-[6px] ${nb.shadow}`}
              style={{ backgroundColor: C.yellow, borderColor: C.black }}
            >
              <p className="font-bold text-sm" style={{ color: C.black }}>
                Ao utilizar o ReUNE, você atesta que compreende e concorda com todas as disposições destes Termos de Uso
                e da nossa Política de Privacidade.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer palette={C} />
    </div>
  );
}
