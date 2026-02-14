# Plan: Redesign Visual do Chat (UNE.AI)

## Objetivos
- Transformar o chat em uma interface moderna e atraente
- Melhorar UX com elementos visuais mais intuitivos
- Alinhar design com a identidade visual do projeto (cores do logo)

## Mudanças Implementadas

### 1. Estilos CSS (`src/components/ChatWidget.css`)
- [x] Animações de entrada suaves para mensagens
- [x] Scrollbar personalizada
- [x] Efeitos de hover e transições
- [x] Variáveis de cores consistentes com o projeto

### 2. Header com Gradiente
- [x] Gradiente usando as cores do logo (laranja → dourado → teal)
- [x] Padrão sutil no background
- [x] Avatar do bot com borda destacada
- [x] Indicador "Online" com pulso animado
- [x] Botões do header estilizados

### 3. Balões de Mensagem
- [x] Rabinhos indicando origem (usuário/bot)
- [x] Cores do projeto:
  - Usuário: gradiente laranja
  - Bot: branco com borda sutil
- [x] Sombras suaves para profundidade
- [x] Animação de entrada slide-in

### 4. Lista de Itens
- [x] Cards organizados com ícones por categoria
- [x] Cores associadas às categorias
- [x] Layout em grid com quantidade e preço
- [x] Total destacado no final
- [x] Fundo sutil diferenciado

### 5. Sugestões (Pills)
- [x] Design tipo "chip" moderno
- [x] Cores ciano/teal
- [x] Efeito hover com elevação
- [x] Animação suave

### 6. Input Estilizado
- [x] Textarea auto-resize
- [x] Borda com gradiente no focus
- [x] Botão de envio circular com gradiente
- [x] Sombra no focus

### 7. Onboarding
- [x] Cards de ação estilizados
- [x] Ícones em círculos coloridos
- [x] Efeito hover com elevação
- [x] Layout organizado

### 8. Animações
- [x] Typing indicator com bounce
- [x] Pulse glow no botão flutuante
- [x] Fade in nas mensagens
- [x] Transições suaves em todos os elementos interativos

## Arquivos Modificados
- `src/components/ChatWidget.tsx` - Componente completamente refatorado
- `src/components/ChatWidget.css` - Novo arquivo de estilos

## Validação
1. [x] Abrir chat e verificar header com gradiente
2. [x] Enviar mensagem e verificar balão com rabinho
3. [x] Receber resposta e verificar balão do bot
4. [x] Testar sugestões (pills)
5. [x] Verificar input com focus
6. [x] Ver onboarding ao iniciar novo chat
7. [x] Testar lista de itens quando gerada

## Correções de Contraste (Pós-Implementação)
- [x] Corrigir cor do texto no input (agora hsl(0 0% 15%) - quase preto)
- [x] Corrigir título do onboarding (agora #1a1a1a)
- [x] Corrigir subtítulo do onboarding (agora #525252)
- [x] Corrigir títulos dos cards de onboarding
- [x] Corrigir descrições dos cards de onboarding
- [x] Corrigir cor do texto nas mensagens do assistente
- [x] Corrigir nome e categoria dos itens na lista
- [x] Corrigir quantidade e preço dos itens
- [x] Corrigir título e data nos cards de eventos
- [x] Corrigir cor do total na lista de itens
