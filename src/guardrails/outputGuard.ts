/**
 * Guardrail de output — valida a resposta do LLM antes de entregar ao usuário.
 * Detecta vazamento de dados sensíveis, system prompt, e JSON malformado.
 */

export interface OutputGuardResult {
  safe: boolean;
  content: string;
  warning?: string;
  blockedReason?: string;
}

const PII_PATTERNS = [
  { regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, label: 'CPF' },
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: 'email' },
  { regex: /\(\d{2}\)\s*\d{4,5}-?\d{4}/g, label: 'telefone' },
  { regex: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, label: 'cartao_credito' },
];

const SYSTEM_PROMPT_LEAK_PATTERNS = [
  /VOCÊ É UNE\.AI/,
  /PERSONALIDADE\s*═+/,
  /FLUXO DE CRIAÇÃO DE EVENTO/,
  /AÇÕES DISPONÍVEIS/,
  /REGRAS CRÍTICAS/,
  /system prompt/i,
  /buildSystemPrompt/,
  /groqService/i,
  /CONTEXTO DO EVENTO ATUAL\s*═+/,
];

function detectPII(text: string): string | null {
  for (const { regex, label } of PII_PATTERNS) {
    if (regex.test(text)) return label;
  }
  return null;
}

function detectSystemPromptLeak(text: string): boolean {
  return SYSTEM_PROMPT_LEAK_PATTERNS.some((pattern) => pattern.test(text));
}

function detectActionJSONIssues(text: string): string | null {
  const hasActionLike = text.includes('"action"') && text.includes('"data"');
  if (!hasActionLike) return null;

  if (text.includes('```')) return 'json_with_markdown';

  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

  if (!cleaned.startsWith('{')) return 'json_not_first';

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.action || !parsed.data) return 'invalid_action_json';
    if (typeof parsed.action !== 'string') return 'action_not_string';
  } catch {
    return 'malformed_json';
  }

  return null;
}

function sanitizeOutput(text: string): string {
  let sanitized = text.trim();

  sanitized = sanitized.replace(/\r\n/g, '\n');
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  return sanitized;
}

export function applyOutputGuardrail(content: string, maxLength = 5000): OutputGuardResult {
  if (!content || content.trim().length === 0) {
    return { safe: false, content: '', blockedReason: 'empty_output' };
  }

  const sanitized = sanitizeOutput(content);

  if (sanitized.length > maxLength) {
    return {
      safe: true,
      content: sanitized.slice(0, maxLength) + '…',
      warning: 'Resposta truncada por exceder limite.',
    };
  }

  const piiLabel = detectPII(sanitized);
  if (piiLabel) {
    return {
      safe: false,
      content: sanitized,
      blockedReason: `pii_detected_${piiLabel}`,
      warning: `Dado sensível (${piiLabel}) detectado na resposta do LLM.`,
    };
  }

  if (detectSystemPromptLeak(sanitized)) {
    return {
      safe: false,
      content: sanitized,
      blockedReason: 'system_prompt_leak',
      warning: 'Vazamento de system prompt detectado na resposta.',
    };
  }

  const jsonIssue = detectActionJSONIssues(sanitized);
  if (jsonIssue) {
    return {
      safe: false,
      content: sanitized,
      blockedReason: jsonIssue,
      warning: 'JSON de ação inválido na resposta do LLM.',
    };
  }

  if (sanitized.length < 2) {
    return {
      safe: true,
      content: 'Desculpe, não consegui gerar uma resposta. Pode tentar novamente?',
      warning: 'Resposta muito curta substituída.',
    };
  }

  return { safe: true, content: sanitized };
}
