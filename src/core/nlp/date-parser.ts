/**
 * Converte diferentes formatos de data para ISO (YYYY-MM-DD)
 */
export function parseToIsoDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const normalized = dateStr.trim().toLowerCase();

  // Formato ISO já (YYYY-MM-DD)
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return dateStr;

  // Formato brasileiro: dd/mm/yyyy ou dd/mm/yy
  const brMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (brMatch) {
    let day = parseInt(brMatch[1], 10);
    let month = parseInt(brMatch[2], 10);
    let year = brMatch[3];

    if (!year) {
      year = new Date().getFullYear().toString();
    } else if (year.length === 2) {
      year = '20' + year;
    }

    // Criar usando componentes locais para evitar shift de timezone
    const localDate = new Date(parseInt(year), month - 1, day);
    const isoYear = localDate.getFullYear();
    const isoMonth = String(localDate.getMonth() + 1).padStart(2, '0');
    const isoDay = String(localDate.getDate()).padStart(2, '0');

    return `${isoYear}-${isoMonth}-${isoDay}`;
  }

  const monthsMap: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
    'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };

  const textMatch = normalized.match(/(?:dia\s+)?(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const month = monthsMap[textMatch[2]];
    const year = textMatch[3] || new Date().getFullYear().toString();
    if (month) return `${year}-${month}-${day}`;
  }

  return null;
}

export function isValidFutureDate(isoDate: string): boolean {
  try {
    // Forçar meio-dia (T12:00:00) para evitar que o fuso horário mude o dia no parse
    const date = new Date(isoDate + 'T12:00:00');
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Comparação puramente de calendário
    return date >= today;
  } catch {
    return false;
  }
}