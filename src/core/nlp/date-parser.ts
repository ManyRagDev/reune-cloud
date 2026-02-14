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

/**
 * Resultado da validação de data
 */
export interface ValidationResult {
  valid: boolean;
  date: string | null;
  warning: 'past' | 'too_close' | null;
  suggestedDate?: string;
  message: string;
  daysFromNow?: number;
}

/**
 * Valida se a data é adequada para um evento
 * - Bloqueia datas no passado
 * - Alerta sobre datas muito próximas (1-7 dias)
 * - Sugere correção de ano para datas no passado
 */
export function validateEventDate(dateStr: string): ValidationResult {
  const isoDate = parseToIsoDate(dateStr);
  
  if (!isoDate) {
    return {
      valid: false,
      date: null,
      warning: null,
      message: 'Não entendi essa data. Pode usar formato DD/MM/AAAA?'
    };
  }

  try {
    // Forçar meio-dia para evitar bug de fuso
    const date = new Date(isoDate + 'T12:00:00');
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        date: null,
        warning: null,
        message: 'Data inválida. Pode verificar?'
      };
    }

    // Hoje à meia-noite para comparação pura de datas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calcular diferença em dias
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Data no passado
    if (diffDays < 0) {
      // Sugerir ano atual ou seguinte
      const currentYear = new Date().getFullYear();
      const parts = isoDate.split('-');
      const month = parts[1];
      const day = parts[2];
      
      // Tentar com ano atual
      const suggestedThisYear = `${currentYear}-${month}-${day}`;
      const suggestedDate = new Date(suggestedThisYear + 'T12:00:00');
      
      // Se com ano atual ainda é passado, sugerir ano que vem
      if (suggestedDate < today) {
        const suggestedNextYear = `${currentYear + 1}-${month}-${day}`;
        return {
          valid: false,
          date: isoDate,
          warning: 'past',
          suggestedDate: suggestedNextYear,
          message: `Ops! Essa data já passou (${dateStr}). Você quer dizer ${day}/${month}/${currentYear + 1}?`,
          daysFromNow: diffDays
        };
      }
      
      return {
        valid: false,
        date: isoDate,
        warning: 'past',
        suggestedDate: suggestedThisYear,
        message: `Ops! Essa data já passou (${dateStr}). Você quer dizer ${day}/${month}/${currentYear}?`,
        daysFromNow: diffDays
      };
    }

    // Hoje - válido mas com observação
    if (diffDays === 0) {
      return {
        valid: true,
        date: isoDate,
        warning: null,
        message: 'Data marcada para hoje!',
        daysFromNow: 0
      };
    }

    // Próximos 7 dias - válido mas alerta
    if (diffDays <= 7) {
      return {
        valid: true,
        date: isoDate,
        warning: 'too_close',
        message: `A data está bem próxima (${diffDays} dias)! Tem certeza que consegue organizar a tempo?`,
        daysFromNow: diffDays
      };
    }

    // Data futura distante - válido sem alertas
    return {
      valid: true,
      date: isoDate,
      warning: null,
      message: 'Data válida!',
      daysFromNow: diffDays
    };

  } catch {
    return {
      valid: false,
      date: null,
      warning: null,
      message: 'Erro ao validar a data. Pode tentar novamente?'
    };
  }
}