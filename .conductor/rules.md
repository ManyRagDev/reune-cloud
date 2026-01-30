# Coding Guidelines & Architectural Laws

## 0. Fluxo de Decisão do ChatWidget (Une.AI Orchestrator)

```mermaid
graph TD
    Start([Mensagem do Usuário]) --> Clean[Clean JSON Response]
    Clean --> Parse{Parse JSON OK?}
    Parse -- Falha --> LogError[Log Error + Toast Sonner]
    LogError --> Retry[Perguntar novamente]
    Retry --> Start
    
    Parse -- Sucesso --> Extract[Extract: tipo_evento, qtd_pessoas, subtipo_evento]
    Extract --> CheckMin{Tem Tipo + Qtd?}
    
    CheckMin -- Não --> AskMissing[Perguntar dados faltantes]
    AskMissing --> Start
    
    CheckMin -- Sim --> CheckHoliday{É Feriado?}
    CheckHoliday -- Sim --> SetDate[Set data feriado + T12:00:00]
    SetDate --> SaveDraft
    
    CheckHoliday -- Não --> CheckTheme{Tema amplo sem horário?}
    CheckTheme -- Sim ex: Junina --> AskTime[Perguntar: Almoço ou Jantar?]
    AskTime --> CheckDate
    
    CheckTheme -- Não --> CheckDate{Tem data definida?}
    
    CheckDate -- Não --> AskDate[Perguntar data]
    AskDate --> ValidateDate{Valida data local}
    ValidateDate -- Inválida --> AskDate
    ValidateDate -- OK --> SetLocalDate[Set data local YYYY-MM-DD + T12:00:00]
    SetLocalDate --> SaveDraft
    
    CheckDate -- Sim --> ValidateDate
    ValidateDate -- Inválida --> AskDate
    ValidateDate -- OK --> SaveDraft
    
    SaveDraft[Status: draft] --> Upsert[upsertEvent via eventManager]
    Upsert --> UpsertOK{Upsert OK?}
    
    UpsertOK -- Sucesso --> CheckIntent{Intenção: gerar itens?}
    
    CheckIntent -- Não --> WaitNext[Aguardando mais dados/comandos]
    WaitNext --> Start
    
    CheckIntent -- Sim --> Generate[Gerar lista via groqService]
    Generate --> SaveItems[Salvar itens via rpc.ts]
    SaveItems --> SetCreated[Status: created]
    SetCreated --> ShowItems[showItems: TRUE<br/>Snapshot visual]
    ShowItems --> End([Fim do ciclo])
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style CheckMin fill:#fff9c4
    style Upsert fill:#ffecb3
    style UpsertOK fill:#ffcdd2
    style CheckIntent fill:#e1bee7
```

### Explicação dos Estados do Fluxo

| Estado | Descrição | Ação do ChatWidget |
|--------|-----------|---------------------|
| `draft` | Fase inicial e coleta de dados | Chat livre, validação de inputs |
| `created` | Itens gerados e salvos | Exibir itens, permitir confirmação |
| `finalized` | Evento confirmado | Chat encerrado ou modo somente leitura |
| `cancelled` | Evento cancelado | Bloqueio de edições |

### Tratamento de Erros

1. **JSON Parse Error:** Limpeza de backticks/markdown antes do `JSON.parse`
2. **RLS Error:** Reset do `eventoId` local + toast Sonner de erro
3. **Invalid Date:** Re-pedir data com formato claro (DD/MM/AAAA)
4. **Missing Context:** Detectar edição vs. criação para carregar/salvar corretamente

### Integração com Arquitetura

- **Orquestrador:** `simpleOrchestrator.ts` (NUNCA `chatOrchestrator.ts`)
- **IA:** `groqService.ts` com prioridade para chaves específicas
- **Banco:** Acessos via `src/api/rpc.ts`
- **Persistência:** `upsertEvent` no `eventManager`
- **UI:** `shadcn/ui` + `sonner` toasts

---

## 1. AI & Orchestration Architecture

- **Single Source of Truth:** O único orquestrador válido é `src/core/orchestrator/simpleOrchestrator.ts`.
- **Legacy Ban:** O arquivo `chatOrchestrator.ts` é obsoleto/legado e **NÃO** deve ser importado ou utilizado.
- **Groq Service:** A inteligência reside em `src/services/groqService.ts`. Ele deve priorizar chaves específicas (`tipo_evento`, `finalidade_evento`) sobre genéricas.
- **Groq Service:** A inteligência reside em `src/services/groqService.ts`. Ele deve priorizar chaves específicas (`tipo_evento`, `finalidade_evento`) sobre genéricas.

## 2. JSON & Data Reliability

- **Strict Parsing:** Respostas da IA devem ser tratadas com uma função de limpeza (remover backticks/markdown) antes do `JSON.parse`.
- **Schema Enforcement:** A IA não pode inventar chaves (ex: `event_name`). Deve-se usar estritamente `tipo_evento` e `qtd_pessoas`.
- **Hierarquia:** Se a IA extrair `subtipo_evento` (ex: "Festa Junina"), isso tem precedência sobre `tipo_evento` (ex: "Festa") na lógica de decisão.

## 3. Date & Timezone Handling (Critical)

- **No UTC for Dates:** Nunca utilize `new Date().toISOString()` para definir datas de eventos, pois isso converte para UTC e causa o bug "D-1" (dia anterior) no Brasil.
- **Local Date:** Para definir "hoje", use `new Date().toLocaleDateString('en-CA')` (formato YYYY-MM-DD local) ou construa a string manualmente baseada nos métodos locais (`getFullYear`, `getMonth`, `getDate`).
- **Parsing:** Ao validar datas futuras, force o horário para `T12:00:00` para evitar viradas de dia indesejadas por fuso horário.

## 4. Database Access (Supabase)

- **Access Layer:** Todo acesso ao banco deve ser feito via `src/api/rpc.ts` ou funções encapsuladas. Não chame `supabase.from` diretamente na UI.
- **Upsert Logic:** A criação/edição de eventos deve usar a função unificada `upsertEvent` no `eventManager`.
- **Error Handling:** Erros de permissão (RLS) ao tentar editar um evento devem acionar uma limpeza de ID local (`reset`) em vez de travar a aplicação.

## 5. UI/UX Standards

- **Component Library:** Use `shadcn/ui`.
- **Feedback:** Use `sonner` para toasts.
- **State Management:** O `ChatWidget` deve gerenciar o `eventoId` com cuidado, limpando-o explicitamente ao iniciar um novo fluxo ("Novo Evento").

## 6. 🏁 DEFINITION OF DONE (Obrigatório)
Uma tarefa ou track SÓ é considerada finalizada quando:
1. O código foi gerado e aplicado.
2. O arquivo `plan.md` foi atualizado (marcando `[x]`).
3. (Se for final de track) O arquivo `/tracks.md` foi atualizado.

SEMPRE termine sua resposta gerando o *diff* de atualização desses arquivos markdown. Não espere eu pedir.

## 7. MANUTENÇÃO DA VERDADE (Product Integrity)
- O arquivo `product.md` reflete as Regras de Negócio e o Comportamento Core.
- Se uma alteração de código (ex: refatoração de status, nova regra de negócio) contradizer o que está escrito no `product.md`, você DEVE propor a atualização do texto do `product.md` no mesmo PR/Commit.
- Mantenha a documentação sincronizada com a realidade do código.