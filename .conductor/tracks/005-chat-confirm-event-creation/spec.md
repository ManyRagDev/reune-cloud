# Especificação: Confirmação Antes de Criar Evento

## Contexto
Atualmente quando o usuário diz "quero fazer um churrasco pra 10 pessoas dia 25/12", o chat imediatamente cria o evento e já gera a lista de itens. Isso é estranho porque:
1. A lista "surge do nada" sem o usuário pedir
2. Se o usuário digitou errado (15 em vez de 50), já criou errado
3. Não há momento de "respirar" na conversa

## Objetivo
Criar um fluxo mais natural onde o chat **confirma o entendimento** antes de executar ações irreversíveis.

## Comportamento Esperado

### Fluxo Atual (Problema)
```
Usuário: "Quero fazer um churrasco pra 10 pessoas dia 25/12"
Chat: [imediatamente cria evento e mostra lista]
     "Pronto! Montei a lista completa pro churrasco de 10 pessoas ✨"
```

### Fluxo Desejado
```
Usuário: "Quero fazer um churrasco pra 10 pessoas dia 25/12"
Chat: "Entendi! Você quer organizar um churrasco para 10 pessoas no dia 25/12. Posso criar o evento?"
     [sugestões: "Sim, criar!", "Alterar dados"]

Usuário: "Sim, criar!"
Chat: "Show! Evento criado. Quer que eu monte a lista de itens agora?"
     [sugestões: "Gerar lista", "Só salvar por enquanto"]
```

## Mudanças Técnicas

### 1. Novo Status Intermediário: `confirming`
- Status temporário entre `draft` e `created`
- Indica que temos dados suficientes mas aguardando confirmação explícita

### 2. Modificações no `groqService.ts`
- Novas intenções: `request_confirmation`, `confirmed`, `cancelled`
- Quando dados estiverem completos (tipo + qtd + data), retornar JSON:
```json
{
  "action": "request_confirmation",
  "data": {
    "tipo_evento": "churrasco",
    "qtd_pessoas": 10,
    "data_evento": "2025-12-25"
  }
}
```

### 3. Modificações no `simpleOrchestrator.ts`
- Detectar `action: "request_confirmation"`
- NÃO criar evento ainda, apenas salvar no `collected_data`
- Retornar mensagem de confirmação com sugestões
- Quando receber confirmação explícita, aí sim criar evento

### 4. Sugestões de Resposta Contextuais
Baseado nos dados coletados, sugerir:
- "Sim, criar evento!"
- "Mudar quantidade"
- "Mudar data"
- "Cancelar"

## Critérios de Aceitação
- [ ] Chat pergunta confirmação antes de criar evento
- [ ] Chat pergunta confirmação antes de gerar itens
- [ ] Sugestões de resposta permitem corrigir dados
- [ ] Fluxo ainda funciona se usuário digitar tudo de uma vez
- [ ] Fluxo funciona se usuário fornecer dados aos poucos
