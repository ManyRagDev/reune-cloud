# Track 018 — Landing Page de Alta Conversão para Amigo Secreto (Tráfego de Redes Sociais)

## Objetivo
Transformar a página `/amigo-secreto` em uma Landing Page moderna, de altíssima conversão, com visual Neobrutalism vibrante, copy persuasiva e pronta para receber tráfego das redes sociais (Instagram, TikTok, WhatsApp, anúncios ou posts orgânicos). A página deve conectar diretamente com o novo Wizard em 3 passos (`SecretSantaWizardModal.tsx`) e conter metadados Open Graph para rich preview no WhatsApp.

---

## Arquivos & Recursos Impactados
- **Página Principal:**
  - `src/pages/SecretSantaLanding.tsx`: Redesenho completo da landing page com narrativa de conversão, comparação dos modos (Aberto vs Anti-Penetras), mockup de celular interativo, benefícios, casos de uso (Firma, Família, Amigos), FAQ em acordeão e sticky CTA mobile.
- **Componentes e Recursos:**
  - `src/components/events/SecretSantaWizardModal.tsx`: Acionamento imediato a partir de todos os CTAs da página.
  - `src/App.tsx`: Garantir rotas `/amigo-secreto`, `/amigosecreto` e atalhos limpos.
  - Metadados OpenGraph (`react-helmet`) para rich card no WhatsApp e redes sociais.

---

## Plano de Execução Detalhado

### Fase 1: Arquitetura da Página & Copywriting de Conversão
- [x] **1.1 Hero Section Magnética:**
  - Headline direta que ataca a dor: *"Chega de papelzinho rasgado e penetra no grupo."*
  - Proposta de valor: *"Crie seu Amigo Secreto em 2 minutos com sorteio justo, lista de presentes e convites que você manda direto no WhatsApp."*
  - Badges de prova e confiança: *"100% Gratuito"*, *"Sem Baixar App"*, *"Sorteio Seguro com PIN"*.
  - Botão de Ação Neobrutalism que abre o `SecretSantaWizardModal`.
  - Preview visual / Mockup do card de convite no WhatsApp e revelação no celular.

- [x] **1.2 O Grande Diferencial: 2 Modos de Convidar:**
  - Comparativo visual interativo:
    - 🚀 **Link Aberto do Grupo:** 1 link para a galera do WhatsApp entrar e criar o PIN.
    - 🛡️ **Convites Anti-Penetras:** Lista fechada de nomes com links individuais blindados contra penetras.

- [x] **1.3 Como Funciona em 3 Passos Rápidos:**
  - Passo 1: Defina a data da festa, valores dos presentes e sorteio.
  - Passo 2: Compartilhe os convites prontos no WhatsApp da galera em 1 clique.
  - Passo 3: Cada amigo escolhe seus desejos e revela seu sorteado pelo celular com PIN secreto!

- [x] **1.4 Benefícios que Eliminam Objeções:**
  - 🚫 Ninguém tira a si mesmo (algoritmo anti-marmelada).
  - 🎁 Lista de desejos de presentes (acabou o medo de ganhar meia furada).
  - 📍 Festa da Revelação vinculada com endereço no Google Maps e rotas de Uber/Waze.
  - 🔒 Segredo absoluto: nem o organizador sabe quem tirou quem.

- [x] **1.5 Casos de Uso (Para quem é o ReUNE?):**
  - 💼 Amigo Secreto da Firma (integração e confraternização da equipe)
  - 🏠 Amigo Secreto da Família (fim de ano, Natal, páscoa e aniversários)
  - 🍻 Amigos do Futebol / Galera do Bar
  - 🎓 Turma da Faculdade e Escola

- [x] **1.6 FAQ Interativo (Acordeão Neobrutalism):**
  - Precisa baixar aplicativo?
  - O organizador consegue ver os resultados do sorteio?
  - É realmente gratuito?
  - Como funciona o PIN de segurança?
  - Posso fazer amigo secreto presencial ou à distância?

- [x] **1.7 Sticky Bar Mobile de Conversão & Footer:**
  - Barra flutuante inferior no celular com botão rápido "🎁 Criar Amigo Secreto".
  - Footer com links do ecossistema ReUNE.

### Fase 2: Metadados Open Graph & Social Sharing
- [x] **2.1 Configurar Open Graph Meta Tags:**
  - `og:title`, `og:description`, `og:image`, `og:url` para que o compartilhamento do link gere thumbnail e resumo rico no WhatsApp, Instagram e Twitter/X.

### Fase 3: Validação, Testes e Verificação
- [x] **3.1 Testes e Verificações:**
  - `npm run type-check` (0 erros).
  - `npm run test:unit` (183/183 verdes).
  - `npm run build` (geração limpa).

---

## Critérios de Aceite (Definition of Done)
1. A página `/amigo-secreto` entrega uma experiência visualmente encantadora e profissional no padrão Neobrutalism do ReUNE.
2. É 100% responsiva (otimizada prioritariamente para celular, por onde virão os cliques do Instagram e TikTok).
3. Todos os CTAs abrem o `SecretSantaWizardModal` com 1 clique para que o usuário comece imediatamente.
4. Explica com total clareza os dois modos (Aberto vs. Anti-Penetras).
5. O rich preview no WhatsApp exibe metadados adequados.
6. TypeScript, testes unitários e build passam sem erros.
