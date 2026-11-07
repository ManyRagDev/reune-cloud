import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Scale, FileText, CheckCircle2, Mail, Bot, AlertCircle } from "lucide-react";
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
            style={{ backgroundColor: C.mint, color: C.black }}
          >
            <ShieldCheck className="w-4 h-4" />
            Conformidade LGPD (Lei Federal nº 13.709/2018)
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Política de Privacidade & Proteção de Dados
          </h1>
          <p className="font-semibold text-sm opacity-70">
            Última revisão formal: {new Date().toLocaleDateString("pt-BR")} • Versão 2.1
          </p>
        </div>

        {/* Content Box */}
        <div
          className={`p-6 md:p-12 rounded-2xl ${nb.border} ${nb.shadowLg}`}
          style={{ backgroundColor: C.cardBg }}
        >
          {/* Executive Summary Card */}
          <div
            className={`p-5 mb-8 rounded-xl ${nb.border} flex flex-col sm:flex-row items-start sm:items-center gap-4`}
            style={{ backgroundColor: C.sectionBg }}
          >
            <div
              className={`p-3 rounded-lg ${nb.border} shrink-0`}
              style={{ backgroundColor: C.yellow, color: C.black }}
            >
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm">
              <p className="font-black text-base mb-1">Nosso compromisso com você</p>
              <p className="opacity-80 leading-relaxed font-medium">
                O <strong>ReUNE</strong> preza pela transparência, privacidade e segurança dos seus dados.
                Esta política explica detalhadamente como coletamos, tratamos, protegemos e descartamos suas
                informações em conformidade com a <strong>LGPD</strong> e o <strong>Marco Civil da Internet</strong>.
                Nós <strong>NUNCA vendemos</strong> seus dados pessoais.
              </p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none font-medium text-sm md:text-base leading-relaxed space-y-8">
            {/* 1. Identificação do Controlador e DPO */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>1.</span> Identificação do Controlador e Encarregado (DPO)
              </h2>
              <p>
                A plataforma <strong>ReUNE</strong> atua como <strong>Controladora de Dados Pessoais</strong> nas operações
                realizadas em seus sites, aplicativos e serviços conexos.
              </p>
              <div
                className={`mt-4 p-4 rounded-xl ${nb.border}`}
                style={{ backgroundColor: C.sectionBg }}
              >
                <ul className="list-none space-y-2 text-sm font-semibold">
                  <li><strong>Controlador:</strong> ReUNE Tecnologia e Serviços Digitais</li>
                  <li><strong>Canal de Privacidade & DPO:</strong> contato@reuneapp.com.br</li>
                  <li><strong>Finalidade do Canal:</strong> Atendimento direto a requisições de titulares de dados e comunicação oficial com a Autoridade Nacional de Proteção de Dados (ANPD).</li>
                </ul>
              </div>
            </section>

            {/* 2. Princípios de Privacidade */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>2.</span> Princípios Fundamentais Observados (Art. 6º da LGPD)
              </h2>
              <p>
                Todo e qualquer tratamento de dados pessoais no ReUNE obedece rigorosamente aos princípios da LGPD:
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 list-none pl-0 mt-4">
                {[
                  { title: "Finalidade & Adequação", desc: "Coleta exclusiva para viabilizar eventos e sorteios solicitados." },
                  { title: "Necessidade (Minimização)", desc: "Tratamento restrito aos dados indispensáveis para o serviço." },
                  { title: "Livre Acesso & Transparência", desc: "Consulta facilitada, clara e gratuita sobre seus dados." },
                  { title: "Segurança & Prevenção", desc: "Criptografia, isolamento RLS e salvaguardas contra vazamentos." },
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className={`p-3 rounded-lg ${nb.border} text-xs font-semibold`}
                    style={{ backgroundColor: C.sectionBg }}
                  >
                    <span className="block font-black text-sm mb-1">{item.title}</span>
                    <span className="opacity-80">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 3. Dados Coletados */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>3.</span> Informações que Tratamos e Como Coletamos
              </h2>
              <p>
                A coleta de dados varia conforme a funcionalidade e a modalidade de uso escolhida por você:
              </p>

              <div className="space-y-4 mt-4">
                <div className={`p-4 rounded-xl ${nb.border}`} style={{ backgroundColor: C.sectionBg }}>
                  <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    3.1 Sorteador Relâmpago de Amigo Secreto (Sem Cadastro)
                  </h3>
                  <p className="text-sm opacity-90 mb-2">
                    Para quem opta pela agilidade instantânea sem criar conta:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><strong>Dados Coletados:</strong> Apenas os primeiros nomes ou apelidos dos participantes e, opcionalmente, itens de preferência informados pelo grupo.</li>
                    <li><strong>Processamento:</strong> O sorteio é executado matematicamente (derangement). Cada participante recebe um token efêmero com envelope lacrado digitalmente.</li>
                    <li><strong>Privacidade:</strong> Nenhum endereço de e-mail ou documento é exigido. Os links são acessados de forma protegida e contam com marcador de abertura de lacre para evitar espionagem.</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-xl ${nb.border}`} style={{ backgroundColor: C.sectionBg }}>
                  <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    3.2 Modo Completo ReUNE & Eventos Sociais (Com Conta)
                  </h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><strong>Dados Cadastrais:</strong> Nome completo ou social, endereço de e-mail, senha criptografada (hash) gerenciada pelo Supabase Auth.</li>
                    <li><strong>Dados do Evento:</strong> Título da celebração, data, horário, estimativa de convidados, localização (via Google Maps Places) e listas colaborativas de compras/insumos.</li>
                    <li><strong>Amigo Secreto Avançado:</strong> Wishlists (links e sugestões de presentes), PIN de 4 dígitos para revelação individual e confirmação de presença (RSVP).</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-xl ${nb.border}`} style={{ backgroundColor: C.sectionBg }}>
                  <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    3.3 Interações com o Assistente Une.AI (Inteligência Artificial)
                  </h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><strong>Finalidade Exclusiva:</strong> O Une.AI interpreta suas mensagens (ex.: "churrasco para 25 pessoas sábado à tarde") para estruturar automaticamente listas de compras, quantidades e horários.</li>
                    <li><strong>Transparência e Fornecedores:</strong> O processamento é realizado via Edge Functions seguras conectadas à Groq API.</li>
                    <li><strong>Proteção Absoluta:</strong> Os dados de suas conversas <strong>NÃO</strong> são vendidos e <strong>NÃO</strong> são utilizados para treinamento de modelos públicos de inteligência artificial de fornecedores terceiros.</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-xl ${nb.border}`} style={{ backgroundColor: C.sectionBg }}>
                  <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    3.4 Dados Coletados Automaticamente e Telemetria
                  </h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><strong>Registros de Conexão e Acesso (Marco Civil da Internet):</strong> Endereço IP, porta lógica, data, hora e identificação de requisições. O armazenamento desses logs é <strong>obrigação legal (Art. 15 da Lei nº 12.965/2014)</strong> e mantido sob sigilo por 6 (seis) meses.</li>
                    <li><strong>Métricas de Desempenho e Analytics:</strong> Utilizamos o Google Analytics 4 (GA4) com anonimização ativa para monitorar estabilidade técnica, rotas acessadas e taxa de conclusão de eventos de forma estritamente agregada e sem identificação nominal direta.</li>
                    <li><strong>Armazenamento Local:</strong> Empregamos tokens de sessão em `localStorage` estritamente necessários para manter seu login ativo e registrar a abertura do lacre digital no seu próprio navegador.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Bases Legais */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>4.</span> Bases Legais do Tratamento (Art. 7º da LGPD)
              </h2>
              <p>
                Todo tratamento de dados realizado pelo ReUNE está fundamentado nas seguintes hipóteses legais previstas no Art. 7º da LGPD:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Execução de Contrato (Art. 7º, V):</strong> Para disponibilizar a ferramenta, permitir a gestão colaborativa de eventos, sortear participantes e autenticar seu acesso.</li>
                <li><strong>Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II):</strong> Para a guarda obrigatória dos registros de acesso a aplicações de internet conforme o Art. 15 do Marco Civil da Internet.</li>
                <li><strong>Legítimo Interesse (Art. 7º, IX):</strong> Para prevenção à fraude, suporte a falhas técnicas, aprimoramento da estabilidade do software e segurança dos usuários.</li>
                <li><strong>Consentimento (Art. 7º, I):</strong> Quando expressamente solicitado (por exemplo, ao optar por receber notificações ou convites voluntários).</li>
              </ul>
            </section>

            {/* 5. Compartilhamento */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>5.</span> Compartilhamento de Dados com Terceiros
              </h2>
              <p className="font-bold">
                O ReUNE não comercializa, não aluga e não compartilha dados pessoais com corretores de dados ou para fins de marketing abusivo de terceiros.
              </p>
              <p className="mt-2">
                O compartilhamento de dados ocorre unicamente com:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Outros Participantes do Evento:</strong> Seu nome, listas de presentes e confirmações de presença são visíveis exclusivamente para os convidados do evento do qual você participa.</li>
                <li><strong>Provedores de Infraestrutura Técnica:</strong>
                  <ul className="list-circle pl-6 mt-1 space-y-1 text-sm">
                    <li><em>Supabase:</em> Armazenamento de dados em nuvem criptografada com políticas de Row Level Security (RLS).</li>
                    <li><em>Groq:</em> Processamento de chamadas de IA via API segura com confidencialidade de dados.</li>
                    <li><em>Google Maps / Places:</em> Consulta e geocodificação de endereços mediante busca voluntária do usuário.</li>
                  </ul>
                </li>
                <li><strong>Autoridades Judiciais e Policiais:</strong> Exclusivamente mediante ordem judicial formal e fundamentada, conforme estipulado pelo Marco Civil da Internet e pela legislação brasileira.</li>
              </ul>
            </section>

            {/* 6. Segurança da Informação */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>6.</span> Segurança da Informação e Criptografia
              </h2>
              <p>
                Adotamos salvaguardas técnicas, administrativas e organizacionais de padrão internacional para resguardar a integridade e confidencialidade das informações:
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                {[
                  { icon: Lock, title: "Trânsito Seguro", desc: "Comunicação 100% criptografada via HTTPS/TLS 1.3." },
                  { icon: ShieldCheck, title: "Row Level Security", desc: "Isolamento de banco que restringe o acesso aos dados do próprio usuário." },
                  { icon: AlertCircle, title: "Lacre Digital", desc: "Algoritmos anti-spoiler com hash e alerta de lacre violado." },
                ].map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl ${nb.border} text-center`} style={{ backgroundColor: C.sectionBg }}>
                    <s.icon className="w-5 h-5 mx-auto mb-2 text-orange-600" />
                    <p className="font-black text-sm mb-1">{s.title}</p>
                    <p className="text-xs opacity-80">{s.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs opacity-80">
                Em caso improvável de incidente de segurança que represente risco relevante aos titulares, o ReUNE comunicará formalmente a Autoridade Nacional de Proteção de Dados (ANPD) e os usuários afetados, conforme o Art. 48 da LGPD.
              </p>
            </section>

            {/* 7. Retenção e Descarte */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>7.</span> Retenção e Descarte de Dados Pessoais
              </h2>
              <p>
                Seus dados pessoais são mantidos apenas pelo período necessário para atender às finalidades pelas quais foram coletados:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Contas de Usuário:</strong> Mantidas enquanto a conta estiver ativa. Mediante solicitação de exclusão, os dados pessoais são eliminados em até 30 dias.</li>
                <li><strong>Sorteios Relâmpago:</strong> Como não possuem vínculo a contas fixas, expiram e são desativados após a conclusão da celebração.</li>
                <li><strong>Registros de Conexão:</strong> Armazenados pelo prazo improrrogável de <strong>6 (seis) meses</strong> por expressa determinação do Artigo 15 do Marco Civil da Internet, findo o qual são sumariamente destruídos.</li>
              </ul>
            </section>

            {/* 8. Direitos dos Titulares */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>8.</span> Seus Direitos como Titular (Art. 18 da LGPD)
              </h2>
              <p>
                Você possui total controle sobre seus dados pessoais e pode exercer seus direitos garantidos por lei a qualquer momento:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                {[
                  "1. Confirmação da existência de tratamento;",
                  "2. Acesso aos seus dados pessoais;",
                  "3. Correção de dados incompletos ou desatualizados;",
                  "4. Anonimização, bloqueio ou eliminação de dados excessivos;",
                  "5. Portabilidade dos dados para outro fornecedor;",
                  "6. Eliminação dos dados pessoais tratados sob consentimento;",
                  "7. Informação sobre entidades com as quais houve compartilhamento;",
                  "8. Revogação do consentimento concedido anteriormente.",
                ].map((direito, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${nb.border} font-bold`}
                    style={{ backgroundColor: C.sectionBg }}
                  >
                    {direito}
                  </div>
                ))}
              </div>
              <div
                className={`mt-4 p-4 rounded-xl ${nb.border} border-l-[6px]`}
                style={{ backgroundColor: C.mint, borderColor: C.black }}
              >
                <p className="font-bold text-sm" style={{ color: C.black }}>
                  Como exercer seus direitos: Basta enviar uma mensagem para <strong>contato@reuneapp.com.br</strong> com o assunto "Direitos LGPD".
                  Respondemos em formato simplificado imediatamente ou por declaração detalhada no prazo legal de até <strong>15 (quinze) dias</strong> úteis.
                </p>
              </div>
            </section>

            {/* 9. Menores de Idade */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>9.</span> Privacidade de Crianças e Adolescentes
              </h2>
              <p>
                O ReUNE não é direcionado a crianças menores de 13 anos. Para adolescentes entre 13 e 18 anos, a utilização
                deve ocorrer sob consentimento e supervisão de seus pais ou responsáveis legais, em atendimento ao Estatuto da
                Criança e do Adolescente (ECA) e ao Art. 14 da LGPD. Caso identifiquemos cadastro indevido de menor de 13 anos,
                a conta e seus dados serão prontamente removidos.
              </p>
            </section>

            {/* 10. Contato com a ANPD e DPO */}
            <section>
              <h2 className="text-2xl font-black mb-3 flex items-center gap-2" style={{ color: C.black }}>
                <span>10.</span> Canal de Dúvidas e Órgãos Reguladores
              </h2>
              <p className="mb-4">
                Se você tiver qualquer dúvida sobre esta política, sobre o tratamento de dados pessoais ou desejar relatar qualquer preocupação:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:contato@reuneapp.com.br?subject=DPO%20-%20Privacidade%20ReUNE"
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black text-sm`}
                  style={{ backgroundColor: C.yellow, color: C.black }}
                >
                  <Mail className="w-4 h-4" />
                  Falar com o Encarregado (DPO)
                </a>
              </div>
              <p className="text-xs opacity-75 mt-4">
                Você também possui o direito de peticionar perante a <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong> através dos canais oficiais em <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="underline font-bold">gov.br/anpd</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer palette={C} />
    </div>
  );
}
