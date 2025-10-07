export const TBL = {
  EVENTOS: 'eventos',
  ITENS: 'itens_evento',
  PARTICIPANTES: 'participantes_evento',
  DIST: 'distribuicao_itens',
  PREFS: 'preferencias_usuario',
} as const;

export type TableName = typeof TBL[keyof typeof TBL];