const eventTypes: Record<string, string> = {
  churrasco: 'churrasco',
  pizza: 'pizza',
  feijoada: 'feijoada',
  aniversario: 'aniversário',
  jantar: 'jantar',
};

export function parseEventType(text: string): string | null {
  const t = text.toLowerCase().trim();

  for (const keyword in eventTypes) {
    if (t.includes(keyword)) {
      return eventTypes[keyword];
    }
  }

  return null;
}