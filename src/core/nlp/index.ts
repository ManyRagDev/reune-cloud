// Placeholder para módulo NLP do UNE.Ai
// Aqui podem entrar tokenização, intents, entidades, etc.

export const detectIntent = (text: string): string => {
  const t = text.toLowerCase();
  if (t.includes('churrasco')) return 'create_bbq_event';
  if (t.includes('evento')) return 'create_event';
  return 'unknown';
};