# Track 032: Revisão dos Termos de Uso, Política de Privacidade com LGPD e Limpeza do Rodapé

## Contexto & Objetivo
1. Limpar os links de "Recursos" ("Status do Sistema" e "Press Kit") do rodapé (`Footer.tsx`), eliminando links quebrados que direcionavam a páginas 404.
2. Atualizar integralmente a **Política de Privacidade** (`PrivacyPolicy.tsx`) para plena conformidade com a LGPD (Lei Federal nº 13.709/2018), Marco Civil da Internet (Lei nº 12.965/2014) e práticas éticas de Inteligência Artificial (Une.AI/Groq).
3. Atualizar os **Termos de Uso** (`TermsOfService.tsx`) com delimitação clara de responsabilidades (plataforma de apoio à organização vs. eventos presenciais), regras de conduta, remoção de placeholders (`[CIDADE]`) e alinhamento com a legislação brasileira (CDC e Marco Civil).

---

## Fases de Execução

### Fase 1: Limpeza do Rodapé (`Footer.tsx`)
- [ ] 1.1 Remover os links "Status do Sistema" e "Press Kit" em `src/components/landing/Footer.tsx`.
- [ ] 1.2 Ajustar o grid responsivo do rodapé de 4 para 3 colunas harmoniosas (Marca/Identidade, Jurídico/Legal e Contato/Redes).

### Fase 2: Revisão da Política de Privacidade (`PrivacyPolicy.tsx`) com LGPD
- [ ] 2.1 Definir com clareza o Controlador e o canal oficial do Encarregado pelo Tratamento de Dados Pessoais (DPO).
- [ ] 2.2 Estruturar as Bases Legais de tratamento conforme Art. 7º da LGPD (Execução de contrato, Consentimento, Cumprimento de obrigação legal e Legítimo interesse).
- [ ] 2.3 Detalhar o tratamento específico para cada módulo da plataforma:
  - **Sorteador Relâmpago de Amigo Secreto:** tratamento efêmero de dados mínimos (nomes/apelidos e wishlists), sem necessidade de cadastro, links com tokens criptografados e controle de violação de lacre digital;
  - **Módulo com Conta & Eventos Sociais:** autenticação criptografada via Supabase Auth, dados de participantes, RSVP e listas de insumos com isolamento via Row Level Security (RLS);
  - **Assistente Une.AI:** processamento de mensagens e comandos via Edge Functions e Groq API exclusivamente para apoio logístico, sem reutilização de dados de usuários para treinamento de modelos de terceiros nem comercialização;
  - **Métricas e Analytics:** uso de Google Analytics 4 (GA4) para medição anônima e agregada de tráfego, respeitando parâmetros de privacidade.
- [ ] 2.4 Incorporar formalmente o catálogo de Direitos dos Titulares de Dados (Art. 18 da LGPD) e o prazo de resposta (até 15 dias).
- [ ] 2.5 Incluir diretrizes de Retenção e Descarte de dados, observando o prazo obrigatório de 6 meses de logs de aplicação do Marco Civil da Internet (Art. 15 da Lei nº 12.965/2014).
- [ ] 2.6 Especificar medidas técnicas de segurança da informação e protocolo de notificação em caso de incidentes de segurança.

### Fase 3: Revisão dos Termos de Uso (`TermsOfService.tsx`)
- [ ] 3.1 Atualizar o escopo dos serviços oferecidos pelo ReUNE (Criação com Une.AI, Gestão de Convidados, Amigo Secreto Relâmpago e Completo).
- [ ] 3.2 Remover placeholders genéricos (como `[CIDADE]` e menções a gateways não integrados como Stripe/PayPal).
- [ ] 3.3 Estabelecer cláusula de delimitação de responsabilidade: a plataforma é um software de suporte logístico; a organização, segurança e conduta física nos eventos reais são de responsabilidade exclusiva dos organizadores e participantes.
- [ ] 3.4 Inserir regras claras de conduta do usuário, integridade das comunicações e propriedade intelectual sobre a marca e o código do ReUNE.
- [ ] 3.5 Definir foro de eleição e legislação aplicável (Leis da República Federativa do Brasil, Marco Civil da Internet e Código de Defesa do Consumidor).

### Fase 4: Verificação, Qualidade & Testes
- [ ] 4.1 Executar verificação de tipos TypeScript (`npx tsc --noEmit`).
- [ ] 4.2 Executar suíte de testes unitários (`npm run test:unit`).
- [ ] 4.3 Validar compilação do build com Vite (`npm run build`).
- [ ] 4.4 Atualizar `tracks.md` e `plan.md` com status de conclusão.
