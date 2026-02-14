# Plan: Validação de Data no Passado

## Objetivos
- Bloquear datas no passado antes de criar evento
- Sugerir correção automática de ano
- Alertar sobre datas muito próximas

## Mudanças Propostas

### 1. `src/core/nlp/date-parser.ts`
- [x] Adicionar função `validateEventDate(dateString: string): ValidationResult`
```typescript
interface ValidationResult {
  valid: boolean;
  date: string | null;
  warning?: 'past' | 'too_close' | null;
  suggestedDate?: string;
  message: string;
}
```
- [ ] Detectar data local vs UTC (evitar bug D-1)
- [ ] Calcular diferença em dias da data atual

### 2. `src/core/orchestrator/simpleOrchestrator.ts`
- [x] Quando extrair data, chamar `validateEventDate()`
- [x] Se `valid: false`, retornar mensagem de erro + não prosseguir
- [x] Se `warning: 'past'`, mostrar alerta e sugerir ano correto
- [x] Se `warning: 'too_close'`, mostrar aviso mas permitir continuar

### 3. `src/services/groqService.ts`
- [ ] Adicionar regra ao system prompt:
  - "NUNCA aceite datas no passado"
  - "Se usuário disser data que já passou, peça para confirmar o ano"
- [ ] Validar data retornada pela IA antes de executar ação

### 4. `src/core/orchestrator/chatTemplates.ts`
- [ ] Adicionar templates:
  - `date_in_past`: "Ops! Essa data já passou ({data}). Você quer dizer {data_corrigida}?"
  - `date_too_close`: "A data está bem próxima! Tem certeza que consegue organizar a tempo?"
  - `date_invalid`: "Não entendi essa data. Pode usar formato DD/MM/AAAA?"

## Validação
- [x] Testar: "01/01/2020" → alerta "já passou"
- [x] Testar: "25/12" (dezembro passado) → sugere ano seguinte
- [x] Testar: "ontem" → alerta
- [x] Testar: "hoje" → aceita
- [x] Testar: "amanhã" → aceita com aviso opcional
