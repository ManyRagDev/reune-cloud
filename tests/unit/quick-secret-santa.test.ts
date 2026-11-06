import { describe, it, expect } from 'vitest';
import { performQuickSecretSantaDraw } from '@/utils/secretSantaDraw';

describe('Quick Secret Santa Algorithm & Derangement', () => {
  it('deve rejeitar listas com menos de 3 participantes', () => {
    expect(() => performQuickSecretSantaDraw(['Lucas', 'Mariana'])).toThrow(
      'O Amigo Secreto precisa de pelo menos 3 participantes.'
    );
  });

  it('deve rejeitar participantes com nomes duplicados (case insensitive)', () => {
    expect(() =>
      performQuickSecretSantaDraw(['Lucas', 'Mariana', 'lucas'])
    ).toThrow('Não pode haver nomes repetidos na lista');
  });

  it('deve garantir que ninguém tira a si mesmo em sorteio com 3 participantes', () => {
    const names = ['Lucas', 'Mariana', 'Pedro'];
    const result = performQuickSecretSantaDraw(names);

    expect(result).toHaveLength(3);
    result.forEach((pair) => {
      expect(pair.name).not.toBe(pair.target_name);
    });
  });

  it('deve garantir que ninguém tira a si mesmo em sorteio com 10 participantes', () => {
    const names = [
      'Lucas',
      'Mariana',
      'Pedro',
      'Ana',
      'Carlos',
      'Beatriz',
      'Rafael',
      'Juliana',
      'Felipe',
      'Larissa',
    ];

    const result = performQuickSecretSantaDraw(names);

    expect(result).toHaveLength(10);

    const givers = result.map((r) => r.name);
    const receivers = result.map((r) => r.target_name);

    // Todos doam exatamente uma vez
    expect(new Set(givers).size).toBe(10);
    // Todos recebem exatamente uma vez
    expect(new Set(receivers).size).toBe(10);

    // NINGUÉM tira a si mesmo
    result.forEach((pair) => {
      expect(pair.name).not.toBe(pair.target_name);
    });
  });

  it('deve manter invariante derangement em 100 iterações aleatórias consecutivas', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    for (let i = 0; i < 100; i++) {
      const result = performQuickSecretSantaDraw(names);
      result.forEach((pair) => {
        expect(pair.name).not.toBe(pair.target_name);
      });
    }
  });

  it('deve ignorar espaços em branco e itens vazios nos nomes', () => {
    const names = ['  Lucas  ', 'Mariana', ' Pedro ', '', '   '];
    const result = performQuickSecretSantaDraw(names);

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.name)).toEqual(
      expect.arrayContaining(['Lucas', 'Mariana', 'Pedro'])
    );
  });
});
