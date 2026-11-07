# Track 028: Redesign Compacto do Modal de Escolha no Mobile (Zero Scroll, Decisão Imediata em 1 Tela)

## 🎯 Objetivo
Transformar o modal de pré-decisão (`SecretSantaChoiceModal.tsx`) em uma interface ultra-compacta no mobile, garantindo que **ambos os cards fiquem 100% visíveis simultaneamente na tela do celular sem necessidade de qualquer rolagem (zero scroll)**.

### Requisitos Específicos:
1. **Zero Scroll no Mobile:** O modal completo (título, subtítulo, card 1 com cadastro, card 2 sem cadastro e rodapé) deve caber perfeitamente no viewport mobile (a partir de 360x640 / 390x844) sem disparar scrollbar ou esconder o segundo card.
2. **Síntese de Conteúdo de Alta Conversão (Opção 1 Aprovada):**
   - **Card 1: 👑 Com Cadastro • Completo:**
     - Título + Badge: "👑 Com Cadastro • Mais Recursos"
     - Subtexto objetivo: "1 link único no WhatsApp da galera, lista de presentes dos sonhos e mapa da festa."
     - Botão de ação: "Criar com Conta (1 min) ➔"
   - **Card 2: ⚡ Sem Cadastro • Só Praticidade:**
     - Título + Badge: "⚡ Sem Cadastro • Só Praticidade"
     - Subtexto objetivo: "Digite os nomes, sorteie na hora e envie envelopes com selo de cera no WhatsApp."
     - Botão de ação: "Sortear Direto Sem Conta ➔"
3. **Ergonomia e Toque:**
   - Botões táteis com altura confortável (`min-h-[46px]`), touch-press feedback e padding equilibrado.
   - Micro-prova de confiança no rodapé: "🔒 100% Gratuito em ambos os modos".
4. **Desktop Responsivo:**
   - No desktop (`md:`), manter visual lado a lado equilibrado e elegante.

---

## 📋 Checklist de Implementação
- [x] 1. Redesenhar `src/components/events/SecretSantaChoiceModal.tsx` com a arquitetura compacta sintética
- [x] 2. Ajustar containers, paddings (`p-4` no mobile) e tipografia para garantir altura total do modal <= 540px no mobile
- [x] 3. Validação de compilação TypeScript com `npm run build`
- [x] 4. Teste automatizado com Playwright no viewport 390x844 e 360x740 (validando que ambos os cards estão visíveis na viewport sem scroll)
- [x] 5. Capturar screenshots mobile do modal aberto e salvar em diretório de auditoria
- [x] 6. Commit, Push na branch `main` e validação do deploy
