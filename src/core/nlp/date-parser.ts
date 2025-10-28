/**
 * Converte diferentes formatos de data para ISO (YYYY-MM-DD)
 * Suporta:
 * - dd/mm/yyyy ou dd/mm/yy
 * - yyyy-mm-dd
 * - "dia X de mês" ou "X de mês"
 */
export function parseToIsoDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const normalized = dateStr.trim().toLowerCase();

  // Formato ISO já (YYYY-MM-DD)
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return dateStr;
  }

  // Formato brasileiro: dd/mm/yyyy ou dd/mm/yy
  const brMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    
    if (!year) {
      // Se não tem ano, usa o ano atual
      year = new Date().getFullYear().toString();
    } else if (year.length === 2) {
      // Ano com 2 dígitos: assume 20XX
      year = '20' + year;
    }
    
    return `${year}-${month}-${day}`;
  }

  // Formato textual: "dia 15 de novembro", "15 de novembro", "15 de novembro de 2025"
  const monthsMap: Record<string, string> = {
    'janeiro': '01', 'jan': '01',
    'fevereiro': '02', 'fev': '02',
    'março': '03', 'mar': '03',
    'abril': '04', 'abr': '04',
    'maio': '05', 'mai': '05',
    'junho': '06', 'jun': '06',
    'julho': '07', 'jul': '07',
    'agosto': '08', 'ago': '08',
    'setembro': '09', 'set': '09',
    'outubro': '10', 'out': '10',
    'novembro': '11', 'nov': '11',
    'dezembro': '12', 'dez': '12',
  };

  const textMatch = normalized.match(/(?:dia\s+)?(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const monthName = textMatch[2];
    const year = textMatch[3] || new Date().getFullYear().toString();
    const month = monthsMap[monthName];
    
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Se não conseguiu parsear, retorna null
  return null;
}

/**
 * Valida se uma data ISO é válida e no futuro (ou hoje)
 */
export function isValidFutureDate(isoDate: string): boolean {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return false;
    
    // Aceita datas de hoje em diante
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  } catch {
    return false;
  }
}
