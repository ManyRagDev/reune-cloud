# Guia de Implementação de Chatbot com IA

Este documento é um **guia técnico de referência** para implementar um chatbot com IA em qualquer aplicação. Baseado na arquitetura do **Kliper**, um sistema de agendamento para barbearias.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPONENTE UI                            │
│                    (WhatsAppSimulator.tsx)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - Estado local: messages[], inputText, isTyping        │    │
│  │  - Renderiza histórico de mensagens                     │    │
│  │  - Captura input do usuário                             │    │
│  │  - Chama serviço de IA ao enviar                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVIÇO DE IA                                │
│                     (groqService.ts)                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - Monta system prompt com contexto dinâmico            │    │
│  │  - Envia histórico + mensagem para LLM                  │    │
│  │  - Detecta JSON de ação na resposta                     │    │
│  │  - Executa ação (criar agendamento, etc)                │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REPOSITÓRIOS DE DADOS                         │
│           (appointmentRepository.ts, serviceRepository.ts)       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - Abstrai acesso ao banco de dados                     │    │
│  │  - CRUD de entidades (Client, Appointment, Service)     │    │
│  │  - Pode ser mock local ou Supabase real                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                                │
│                      (Supabase)                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Tabelas: Client, Appointment, BarberSettings           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Arquivos

```
src/
├── components/
│   └── features/
│       └── ai/
│           ├── WhatsAppSimulator.tsx   # UI do chat
│           ├── AIPage.tsx              # Página que contém o chat
│           ├── SmartInbox.tsx          # Inbox de mensagens pendentes
│           └── PilotConfig.tsx         # Configurações do piloto automático
├── services/
│   ├── groqService.ts                  # Integração com LLM
│   ├── appointmentRepository.ts        # CRUD de agendamentos (Supabase)
│   └── serviceRepository.ts            # CRUD de serviços (mock)
├── lib/
│   └── supabase.ts                     # Cliente Supabase
└── .env                                # Variáveis de ambiente
```

---

## 3. Componente UI do Chat

### Interface de Mensagem

```typescript
interface Message {
    id: string           // ID único (timestamp)
    text: string         // Conteúdo da mensagem
    sender: 'user' | 'ai' // Quem enviou
    timestamp: Date      // Quando foi enviada
}
```

### Estados do Componente

```typescript
const [messages, setMessages] = useState<Message[]>([])    // Histórico
const [inputText, setInputText] = useState("")              // Input atual
const [isTyping, setIsTyping] = useState(false)             // IA digitando
```

### Fluxo de Envio de Mensagem

```typescript
const handleSend = async () => {
    if (!inputText.trim()) return

    // 1. Adiciona mensagem do usuário ao histórico
    const userMsg: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInputText("")
    setIsTyping(true)

    try {
        // 2. Chama serviço de IA passando histórico completo
        const response = await GroqService.processMessage(inputText, messages)

        // 3. Adiciona resposta da IA ao histórico
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: response,
            sender: 'ai',
            timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMsg])
    } catch (error) {
        // 4. Trata erros
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: "⚠️ Erro ao conectar com a IA.",
            sender: 'ai',
            timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMsg])
    } finally {
        setIsTyping(false)
    }
}
```

### Auto-scroll para última mensagem

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)

const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
}

useEffect(() => {
    scrollToBottom()
}, [messages])

// No JSX, no final da lista de mensagens:
<div ref={messagesEndRef} />
```

---

## 4. Serviço de IA (Orquestrador)

### Estrutura Principal

```typescript
export const GroqService = {
    // Obtém API key do ambiente
    getApiKey: () => import.meta.env.VITE_GROQ_API_KEY,

    // Processa mensagem do usuário
    processMessage: async (userMessage: string, history: Message[]): Promise<string>,

    // Executa ação quando IA retorna JSON
    executeAction: async (actionData: any): Promise<string>
}
```

### System Prompt (Instruções para a IA)

```typescript
const systemPrompt = `
Você é o assistente virtual da "[NOME DO NEGÓCIO]". 
Seu objetivo é [OBJETIVO PRINCIPAL] de forma autônoma.
Hoje é: ${new Date().toISOString().split('T')[0]}.

SERVIÇOS DISPONÍVEIS:
${servicesContext}  // Lista dinâmica de serviços

REGRAS:
1. Seja educado, breve e use emojis moderadamente.
2. Identifique a intenção do usuário.
3. Se tiver todos os dados necessários, retorne JSON para ação.
4. Formato do JSON:
{
  "action": "nome_da_acao",
  "data": {
    // dados necessários para a ação
  }
}
5. Se não tiver os dados, continue a conversa normalmente.

IMPORTANTE: Se gerar JSON, NÃO escreva nada além do JSON.
`
```

### Chamada à API do LLM

```typescript
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: systemPrompt },
            // Histórico convertido para formato OpenAI
            ...history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: "user", content: userMessage }
        ],
        temperature: 0.7
    })
})
```

### Detecção e Execução de Ações

```typescript
const aiContent = data.choices[0].message.content

// Detecta JSON na resposta
try {
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
        const jsonObj = JSON.parse(jsonMatch[0])
        
        if (jsonObj.action === "create_appointment") {
            // Executa a ação e retorna confirmação
            return await GroqService.executeAction(jsonObj.data)
        }
    }
} catch (e) {
    // Não é JSON, retorna texto normalmente
}

return aiContent
```

---

## 5. Repositórios de Dados

### Padrão de Interface

```typescript
interface Entity {
    id: string
    // ... outros campos
}

export const EntityRepository = {
    getAll: async (): Promise<Entity[]>,
    getById: async (id: string): Promise<Entity | undefined>,
    create: async (entity: Omit<Entity, 'id'>): Promise<Entity>,
    update: async (id: string, updates: Partial<Entity>): Promise<Entity>,
    delete: async (id: string): Promise<void>
}
```

### Repositório com Mock (Desenvolvimento)

```typescript
const MOCK_DATA: Entity[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
]

export const EntityRepository = {
    getAll: async (): Promise<Entity[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve([...MOCK_DATA]), 300)
        })
    },
    // ... outros métodos
}
```

### Repositório com Supabase (Produção)

```typescript
import { supabase } from "@/lib/supabase"

export const EntityRepository = {
    getAll: async (): Promise<Entity[]> => {
        const { data, error } = await supabase
            .from('Entity')
            .select('*')
            .order('createdAt', { ascending: false })

        if (error) {
            console.error('Error:', error)
            return []
        }
        return data
    },

    create: async (entity: Omit<Entity, 'id'>): Promise<Entity> => {
        // IMPORTANTE: Gerar UUID no frontend se tabela não tem DEFAULT
        const newId = crypto.randomUUID()
        
        const { data, error } = await supabase
            .from('Entity')
            .insert({ id: newId, ...entity })
            .select()
            .single()

        if (error) throw error
        return data
    }
}
```

---

## 6. Configuração do Supabase

### Cliente

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase Configuration Missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL="https://xxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_GROQ_API_KEY="gsk_xxxxx"
```

---

## 7. Checklist de Implementação

### Fase 1: Estrutura Base
- [ ] Criar componente UI do chat com estados básicos
- [ ] Implementar interface de mensagem
- [ ] Criar fluxo de envio/recebimento visual

### Fase 2: Integração com IA
- [ ] Configurar variáveis de ambiente
- [ ] Implementar serviço de IA com system prompt
- [ ] Conectar UI ao serviço de IA

### Fase 3: Ações da IA
- [ ] Definir formato JSON para ações
- [ ] Implementar detecção de JSON na resposta
- [ ] Criar função `executeAction` para cada tipo de ação

### Fase 4: Persistência
- [ ] Criar repositórios (mock ou real)
- [ ] Conectar ações da IA aos repositórios
- [ ] Testar fluxo completo

### Fase 5: Refinamento
- [ ] Ajustar system prompt para domínio específico
- [ ] Adicionar tratamento de erros
- [ ] Implementar indicador de "digitando"
- [ ] Adicionar auto-scroll

---

## 8. Adaptação para Outros Domínios

Para adaptar este chatbot para outro contexto:

1. **Alterar o System Prompt**: Trocar o objetivo e regras
2. **Definir novas Ações**: Criar novos formatos de JSON
3. **Ajustar Repositórios**: Criar entidades do novo domínio
4. **Personalizar UI**: Cores, ícones, layout

### Exemplo: Chat para Clínica Médica

```typescript
const systemPrompt = `
Você é o assistente virtual da "Clínica Saúde Total".
Seu objetivo é agendar consultas médicas.

ESPECIALIDADES:
${specialtiesContext}

AÇÕES DISPONÍVEIS:
- create_appointment: Agendar consulta
- check_availability: Verificar horários
- cancel_appointment: Cancelar consulta
`
```

---

## 9. Boas Práticas

1. **Sempre passar histórico completo** para manter contexto
2. **Usar temperature ~0.7** para respostas naturais mas consistentes
3. **Validar JSON** antes de executar ações
4. **Gerar UUID no frontend** se banco não tem DEFAULT
5. **Usar try/catch** em todas as operações assíncronas
6. **Log detalhado** para debug (`console.log('[Serviço] Mensagem')`)
7. **Separar responsabilidades**: UI → Serviço IA → Repositório → DB
