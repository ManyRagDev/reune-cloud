import { OllamaProvider } from './providers/ollama';
import { OpenAiProvider } from './providers/openai';
import { GroqProvider } from './providers/groq';
import { TogetherProvider } from './providers/together';
import type { LlmProvider } from './providers/base';

export function routeProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
  switch (provider) {
    case 'openai':
      return new OpenAiProvider();
    case 'groq':
      return new GroqProvider();
    case 'together':
      return new TogetherProvider();
    case 'ollama':
    default:
      return new OllamaProvider();
  }
}