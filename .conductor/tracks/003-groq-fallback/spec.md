# Protocolo de Interrogatório: Fallback Groq API (429)

## Contexto
O usuário deseja um tratamento amigável para quando a API do Groq atingir o limite de requisições (Rate Limit 429). Atualmente, a Edge Function já detecta o 429 e retorna um erro, mas o frontend apenas exibe uma mensagem de erro genérica no chat.

## Technical Facts
- **Edge Function (`llm-chat`)**: Já captura o 429 do Groq e retorna status 429 com code `rate_limit`.
- **Frontend (`groqService`)**: Atualmente captura o erro e retorna uma string simples: `"Erro ao conectar com a IA: [mensagem]"`.
- **UX Atual**: O erro aparece como uma mensagem balão do assistente, o que pode parecer que a IA "quebrou" em vez de estar ocupada.

## Perguntas de Alta Entropia

1. **UX do Erro:** Além do Toast (Sonner) solicitado, como a mensagem deve aparecer no chat?
   - [ ] Manter como mensagem de texto (balão do assistente).
   - [x] Não mostrar nada no chat (apenas o Toast), dando a sensação de que a mensagem não foi enviada para o usuário tentar depois?
   - [ ] Mostrar uma mensagem de sistema diferenciada (não balão de fala)?

2. **Bloqueio de Retry:**
   - Devemos desabilitar o input do usuário temporariamente quando isso ocorrer? Ou deixamos ele tentar de novo à vontade (o que pode piorar o rate limit)?
   Sim, devemos desabilitar temporariamente

3. **Simulação de Teste:**
   - Como não podemos forçar o Groq a dar 429 sob demanda facilmente, você autoriza adicionar uma flag temporária (ex: `SIMULATE_429=true`) no `groqService` para validarmos o comportamento da UI?
   sim

4. **Persistência:**
   - Se o usuário estiver no meio de um fluxo (ex: gerando itens), devemos tentar salvar o estado atual para que ele não perca o que já digitou?
   Sim, salve tudo que ele fez e crie o evento, exibindo uma mensagem adicional para que ele termine de configurar manualmente.

---
 aguardando respostas para gerar `plan.md`.
