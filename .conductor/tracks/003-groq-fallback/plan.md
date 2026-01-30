# Plan: Fallback Groq API (429)

## Objetivos
- Tratar o erro 429 (Rate Limit) da API do Groq de forma silenciosa e resiliente.
- Evitar mensagens de erro técnico no chat.
- Garantir a persistência dos dados já coletados (fallback save).
- Notificar o usuário via Toast.

## Mudanças Propostas

### 1. `src/services/groqService.ts`
- [x] **Adicionar Flag de Simulação:** `const SIMULATE_429 = true;` (temporário).
- [x] **Tipar Erro:** Criar classe `GroqRateLimitError`.
- [x] **Tratamento no `processMessage`:**
  - Detectar 429 da Edge Function.
  - Lançar `GroqRateLimitError` para ser capturado pelo orquestrador.

### 2. `src/core/orchestrator/simpleOrchestrator.ts`
- [x] **Try/Catch Específico:**
  - Envolver chamada ao `processMessage`.
  - Se capturar `GroqRateLimitError`:
    1. Executar `upsertEvent` com o contexto atual (`collectedData`).
    2. Retornar payload de sucesso parcial:
       - `toast`: "Muitas requisições. Rascunho salvo!"
       - `mensagem`: "O sistema está com alta demanda. Salvei o que já conversamos como rascunho. Por favor, finalize os detalhes manualmente."
       - `closeChat`: true (ou false, dependendo da UX desejada, mas "finalizar manualmente" sugere fechar o chat e ir para o form).

### 3. `src/components/ChatWidget.tsx`
- [x] Verificar se é necessário lógica extra para desabilitar input - **Decisão:** `closeChat: true` no payload remove a capacidade de interagir naquela thread, que é suficiente.

## Validação
1. Ativar `SIMULATE_429` (Já está true no código).
2. Tentar criar evento.
3. Verificar Toast + Mensagem de Fallback + Evento criado no banco.
