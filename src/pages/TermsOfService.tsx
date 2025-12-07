import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao site
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent">
            Termos de Uso
          </h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Aceitação dos Termos</h2>
              <p>
                Bem-vindo ao ReUNE! Ao acessar ou usar nosso aplicativo, você concorda em cumprir e estar vinculado
                a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não use nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Descrição do Serviço</h2>
              <p className="mb-4">
                O ReUNE é uma plataforma que facilita a organização de eventos, reuniões e celebrações entre amigos.
                Nossos serviços incluem:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criação e gestão de eventos</li>
                <li>Convites digitais e confirmação de presença</li>
                <li>Chat e interação entre participantes</li>
                <li>Compartilhamento de fotos e memórias</li>
                <li>Organização de Amigo Secreto</li>
                <li>Divisão de despesas e contribuições</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Elegibilidade</h2>
              <p>
                Para usar o ReUNE, você deve:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Ter pelo menos 13 anos de idade</li>
                <li>Fornecer informações verdadeiras e completas ao se cadastrar</li>
                <li>Manter suas credenciais de acesso seguras e confidenciais</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Conta do Usuário</h2>
              <p className="mb-4">
                Ao criar uma conta no ReUNE, você concorda em:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer informações precisas, atuais e completas</li>
                <li>Manter e atualizar prontamente suas informações</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                <li>Não compartilhar suas credenciais de acesso</li>
                <li>Notificar-nos imediatamente sobre qualquer violação de segurança</li>
              </ul>
              <p className="mt-4">
                Reservamos o direito de suspender ou encerrar contas que violem estes termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Conduta do Usuário</h2>
              <p className="mb-4">
                Você concorda em NÃO:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar o serviço para fins ilegais ou não autorizados</li>
                <li>Publicar conteúdo ofensivo, difamatório, obsceno ou discriminatório</li>
                <li>Assediar, intimidar ou ameaçar outros usuários</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
                <li>Tentar obter acesso não autorizado ao sistema</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Fazer scraping, crawling ou uso automatizado do serviço</li>
                <li>Personificar outra pessoa ou entidade</li>
                <li>Usar o serviço para spam ou publicidade não solicitada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Conteúdo do Usuário</h2>
              <p className="mb-4">
                Você retém todos os direitos sobre o conteúdo que publica no ReUNE. Ao publicar conteúdo, você nos concede
                uma licença mundial, não exclusiva, isenta de royalties para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar, reproduzir, modificar e exibir seu conteúdo dentro do serviço</li>
                <li>Armazenar e fazer backup de seu conteúdo</li>
                <li>Distribuir seu conteúdo para outros participantes dos eventos</li>
              </ul>
              <p className="mt-4">
                Você é responsável pelo conteúdo que publica e garante que possui todos os direitos necessários.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Propriedade Intelectual</h2>
              <p>
                O ReUNE e todo seu conteúdo (textos, gráficos, logos, ícones, imagens, código) são propriedade da
                ReUNE ou de seus licenciadores e estão protegidos por leis de direitos autorais, marcas registradas
                e outras leis de propriedade intelectual.
              </p>
              <p className="mt-4">
                Você não pode copiar, modificar, distribuir, vender ou alugar qualquer parte de nossos serviços
                sem permissão expressa por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Funcionalidades Premium</h2>
              <p className="mb-4">
                O ReUNE pode oferecer funcionalidades premium mediante pagamento. Ao adquirir recursos pagos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Os preços estão sujeitos a alterações, mas mudanças não afetarão compras já realizadas</li>
                <li>O pagamento é processado por terceiros seguros (Stripe, PayPal, etc.)</li>
                <li>Assinaturas renovam automaticamente, salvo se canceladas</li>
                <li>Cancelamentos podem ser feitos a qualquer momento através do app</li>
                <li>Reembolsos seguem nossa política de reembolso disponível no app</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Limitação de Responsabilidade</h2>
              <p>
                O ReUNE é fornecido "como está" e "conforme disponível". Não garantimos que o serviço será
                ininterrupto, seguro ou livre de erros. Na máxima extensão permitida por lei:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Não nos responsabilizamos por danos diretos, indiretos, incidentais ou consequenciais</li>
                <li>Não garantimos a precisão ou confiabilidade do conteúdo gerado por usuários</li>
                <li>Não somos responsáveis por interações entre usuários fora do aplicativo</li>
                <li>Nossa responsabilidade total não excederá o valor pago por você nos últimos 12 meses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Rescisão</h2>
              <p className="mb-4">
                Você pode encerrar sua conta a qualquer momento através das configurações do aplicativo.
                Podemos suspender ou encerrar sua conta se:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Você violar estes Termos de Uso</li>
                <li>Seu uso causar riscos legais ou de segurança</li>
                <li>Houver suspeita de fraude ou uso indevido</li>
                <li>Deixarmos de oferecer o serviço</li>
              </ul>
              <p className="mt-4">
                Após o encerramento, você perderá o acesso à sua conta e todo conteúdo associado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Lei Aplicável e Jurisdição</h2>
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas
                serão resolvidas no foro da comarca de [CIDADE], com exclusão de qualquer outro, por mais
                privilegiado que seja.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Alterações nos Termos</h2>
              <p>
                Reservamos o direito de modificar estes termos a qualquer momento. Notificaremos sobre
                mudanças significativas por email ou aviso no aplicativo. O uso continuado após as alterações
                constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Disposições Gerais</h2>
              <p className="mb-4">
                <strong>Acordo Integral:</strong> Estes termos constituem o acordo integral entre você e o ReUNE.
              </p>
              <p className="mb-4">
                <strong>Renúncia:</strong> Nossa falha em fazer cumprir qualquer direito não constitui renúncia.
              </p>
              <p className="mb-4">
                <strong>Divisibilidade:</strong> Se qualquer disposição for considerada inválida, as demais permanecerão em vigor.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Contato</h2>
              <p className="mb-4">
                Para dúvidas sobre estes Termos de Uso:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> contato@reuneapp.com.br</li>
                <li><strong>Suporte:</strong> Disponível dentro do aplicativo</li>
              </ul>
            </section>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mt-8">
              <p className="text-sm">
                <strong>Ao usar o ReUNE, você confirma que leu, entendeu e concordou com estes Termos de Uso
                e nossa Política de Privacidade.</strong>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ReUNE. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
