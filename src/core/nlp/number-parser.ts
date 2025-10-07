const numberWords: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
};

export function parseNumber(text: string): number | null {
  const t = text.toLowerCase().trim();

  // 1. Tenta encontrar um número por extenso
  const words = t.split(/\s+/);
  for (const word of words) {
    if (numberWords[word]) {
      return numberWords[word];
    }
  }

  // 2. Tenta encontrar um número em formato de texto (ex: "10 pessoas")
  const match = t.match(/\b(\d+)\b/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}