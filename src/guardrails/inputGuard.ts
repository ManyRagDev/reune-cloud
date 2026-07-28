/**
 * Guardrail de input — protege o chatbot contra prompt injection e
 * mensagens maliciosas antes que cheguem ao LLM.
 */

export interface InputGuardResult {
  safe: boolean;
  sanitized: string;
  warning?: string;
  blockedReason?: string;
}

const MAX_INPUT_LENGTH = 2000;
const MAX_REPETITION_RATIO = 0.5;

function charRatio(str: string): number {
  const unique = new Set(str).size;
  return unique / Math.max(str.length, 1);
}

function repetitionRatio(str: string): number {
  if (str.length < 30) return 0;
  const half = Math.floor(str.length / 2);
  const firstHalf = str.slice(0, half);
  const secondHalf = str.slice(-half);
  let matches = 0;
  for (let i = 0; i < half; i++) {
    if (firstHalf[i] === secondHalf[i]) matches++;
  }
  return matches / half;
}

const BLOCK_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  { regex: /ignore\s+(all\s+)?(previous|prior|above|todas\s+as|as)\s+(instructions?|instruç[oõ]es?|diretri[zZ]es?)/i, reason: 'injection_ignore_instructions' },
  { regex: /(esqueç[ae]\s+tudo|forget\s+everything|disregard\s+all)/i, reason: 'injection_forget_all' },
  { regex: /you\s+are\s+now\s+(a\s+)?/i, reason: 'injection_role_hijack' },
  { regex: /agora\s+voc[eê]\s+(é|eh)\s+(um|uma)\s+/i, reason: 'injection_role_hijack_pt' },
  { regex: /(?:^|\n)\s*(?:system|assistant|human|user|system\s*prompt)\s*:/im, reason: 'injection_role_spoof' },
  { regex: /novas?\s+instruç[oõ]es?\s*:/i, reason: 'injection_new_instructions_pt' },
  { regex: /\bDAN\b.*\bmode\b/i, reason: 'injection_dan_mode' },
  { regex: /pretend\s+(you\s+are|to\s+be)|finja\s+(que|ser)/i, reason: 'injection_pretend' },
  { regex: /(?:^|\n)\s*={3,}\s*(?:system|instruc|instruç|context|important|importante)/im, reason: 'injection_delimiter_attack' },
  { regex: /you\s+(must|have\s+to|should|need\s+to)\s+(respond|answer|reply|say)/i, reason: 'injection_force_output' },
  { regex: /voc[eê]\s+(deve|precisa|tem\s+que|tem\s+de)\s+(responder|dizer|falar)/i, reason: 'injection_force_output_pt' },
  { regex: /CRITICAL\s*:\s*override|IMPORTANT\s*:\s*new\s+system/i, reason: 'injection_override_kw' },
  { regex: /debug\s*mode|developer\s*mode|admin\s*mode|jailbreak/i, reason: 'injection_jailbreak' },
];

function detectInjection(input: string): string | null {
  for (const { regex, reason } of BLOCK_PATTERNS) {
    if (regex.test(input)) return reason;
  }
  return null;
}

function sanitizeInput(input: string): string {
  let sanitized = input.trim();
  sanitized = sanitized.replace(/\r\n/g, '\n');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  sanitized = sanitized.replace(/[^\S\n]+/g, ' ');
  sanitized = sanitized.replace(/\n +/g, '\n');
  sanitized = sanitized.replace(/ +\n/g, '\n');

  sanitized = sanitized.replace(/^[\s\n]+/, '');
  sanitized = sanitized.replace(/[\s\n]+$/, '');

  return sanitized;
}

export function applyInputGuardrail(input: string, maxLength = MAX_INPUT_LENGTH): InputGuardResult {
  if (!input || input.trim().length === 0) {
    return { safe: false, sanitized: '', blockedReason: 'empty_input' };
  }

  const sanitized = sanitizeInput(input);

  if (sanitized.length > maxLength) {
    return {
      safe: false,
      sanitized: sanitized.slice(0, maxLength),
      blockedReason: 'input_too_long',
      warning: `Mensagem excede ${maxLength} caracteres.`,
    };
  }

  const injectionReason = detectInjection(sanitized);
  if (injectionReason) {
    return {
      safe: false,
      sanitized: '',
      blockedReason: injectionReason,
      warning: 'Comando não permitido detectado.',
    };
  }

  const repRatio = repetitionRatio(sanitized);
  if (repRatio > MAX_REPETITION_RATIO) {
    return {
      safe: false,
      sanitized: '',
      blockedReason: 'repetitive_input',
      warning: 'Mensagem com padrão repetitivo detectado.',
    };
  }

  const uniqueRatio = charRatio(sanitized);
  if (sanitized.length > 50 && uniqueRatio < 0.15) {
    return {
      safe: false,
      sanitized: '',
      blockedReason: 'low_entropy',
      warning: 'Mensagem com baixa entropia detectada.',
    };
  }

  return { safe: true, sanitized };
}
