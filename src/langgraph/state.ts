import { Annotation } from '@langchain/langgraph';
import type { LlmMessage } from '@/types/llm';
import type { EventContext, CollectedData } from '@/types/groq';
import type { ChatUiPayload, EventStatus, EventSnapshot } from '@/types/domain';
import type { RecentEvent } from '@/db/repositories/events';

export const WorkflowState = Annotation.Root({
  messages: Annotation<LlmMessage[]>({
    reducer: (current, update) => [...(current ?? []), ...update],
    default: () => [],
  }),

  userMessage: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),

  userId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),

  eventContext: Annotation<EventContext | undefined>({
    reducer: (_, update) => update ?? undefined,
    default: () => undefined,
  }),

  collectedData: Annotation<Record<string, unknown>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),

  route: Annotation<'agenda' | 'itens' | 'conversational' | 'unknown'>({
    reducer: (_, update) => update,
    default: () => 'unknown',
  }),

  response: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),

  actionExecuted: Annotation<{
    type: string;
    eventoId?: string;
    extractedData?: CollectedData;
  } | undefined>({
    reducer: (_, update) => update ?? undefined,
    default: () => undefined,
  }),

  eventId: Annotation<string | null>({
    reducer: (_, update) => update ?? null,
    default: () => null,
  }),

  snapshot: Annotation<EventSnapshot | undefined>({
    reducer: (_, update) => update ?? undefined,
    default: () => undefined,
  }),

  showItems: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),

  suggestedReplies: Annotation<string[] | undefined>({
    reducer: (_, update) => update ?? undefined,
    default: () => undefined,
  }),

  estado: Annotation<EventStatus>({
    reducer: (_, update) => update,
    default: () => 'draft',
  }),

  hasItems: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),

  historyLoaded: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),

  error: Annotation<string | undefined>({
    reducer: (_, update) => update ?? undefined,
    default: () => undefined,
  }),
});

export type WorkflowStateType = typeof WorkflowState.State;
