/**
 * Carregador de prompts do sistema — lê arquivos .txt e interpola variáveis.
 * Usa Vite ?raw imports para carregar os templates como string.
 */

import type { EventContext } from '@/types/groq';

import chatBaseTemplate from '../../prompts/system/chat-base.txt?raw';

interface TemplateVars {
  [key: string]: string | number | boolean | undefined;
}

const MAX_VALUE_LENGTH = 200;
const TEMPLATE_INJECTION_PATTERN = /\{\{.*?\}\}/g;
const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior|above|todas\s+as|as)\s+(instructions?|instruç[oõ]es?)/gi,
  /═+/g,
  /voc[eê]\s+(é|eh)\s+une\b/gi,
];

export function sanitizeTemplateValue(value: unknown): string {
  if (value === null || value === undefined) return 'Não definido';

  let str = String(value);

  if (str.length > MAX_VALUE_LENGTH) {
    str = str.slice(0, MAX_VALUE_LENGTH) + '…';
  }

  str = str.replace(TEMPLATE_INJECTION_PATTERN, '[bloqueado]');

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    str = str.replace(pattern, '[bloqueado]');
  }

  return str;
}

export function loadPrompt(template: string, vars: TemplateVars = {}): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, sanitizeTemplateValue(value));
  }
  result = result.replaceAll(TEMPLATE_INJECTION_PATTERN, 'Não definido');
  return result;
}

export function buildSystemPrompt(context?: EventContext): string {
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const DAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const todayWeekday = DAYS_PT[now.getDay()];
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
  const daysUntilFri = (5 - now.getDay() + 7) % 7 || 7;
  const nextSat = new Date(now); nextSat.setDate(now.getDate() + daysUntilSat);
  const nextFri = new Date(now); nextFri.setDate(now.getDate() + daysUntilFri);
  const nextSatIso = nextSat.toISOString().slice(0, 10);
  const nextFriIso = nextFri.toISOString().slice(0, 10);

  const baseVars: TemplateVars = {
    CURRENT_DATE: `${todayIso} (${todayWeekday})`,
    NEXT_SATURDAY: nextSatIso,
    NEXT_FRIDAY: nextFriIso,
  };

  let prompt = loadPrompt(chatBaseTemplate, baseVars);

  if (context?.evento) {
    const evento = context.evento;
    prompt += `

═══════════════════════════════════════════════════════════
CONTEXTO DO EVENTO ATUAL
═══════════════════════════════════════════════════════════
ID: ${sanitizeTemplateValue(evento.id) || 'N/A'}
Tipo: ${sanitizeTemplateValue(evento.tipo_evento)}
Pessoas: ${sanitizeTemplateValue(evento.qtd_pessoas)}
Data: ${sanitizeTemplateValue(evento.data_evento)}
Menu/Cardápio: ${sanitizeTemplateValue(evento.menu)}
Finalidade/Ocasião: ${sanitizeTemplateValue(evento.finalidade_evento)}
Status: ${sanitizeTemplateValue(evento.status)}
${context.hasItems ? '✓ Lista de itens já gerada — use o evento_id acima para editar' : '✗ Lista ainda não gerada'}

USE ESTAS INFORMAÇÕES. Não pergunte o que já está definido.
Se menu já está definido acima, NÃO peça novamente.`;
  }

  return prompt;
}
