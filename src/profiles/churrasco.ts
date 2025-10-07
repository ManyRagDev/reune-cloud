import { Item } from "@/types/domain";

// Itens sugeridos antes de serem associados a um evento específico.
type SuggestedItem = Omit<Item, 'id' | 'evento_id'>;

// Coeficientes por pessoa para o cálculo dos itens.
const meatPerPerson = 0.4; // kg
const sausagePerPerson = 0.15; // kg
const breadPerPerson = 2; // unidades (pão de alho)
const beerPerPerson = 1.5; // litros
const sodaPerPerson = 0.5; // litros
const charcoalPerKgOfMeat = 1.5; // kg de carvão por kg de carne/linguiça

/**
 * Perfil para eventos do tipo "churrasco".
 * Contém a lógica para estimar a lista de itens necessários.
 */
export const churrascoProfile = {
  /**
   * Estima a quantidade de itens para um churrasco com base no número de pessoas.
   * @param qtd_pessoas - A quantidade de pessoas no evento.
   * @returns Uma lista de itens sugeridos com quantidades calculadas.
   */
  estimate: (qtd_pessoas: number): SuggestedItem[] => {
    const totalMeat = qtd_pessoas * meatPerPerson;
    const totalSausage = qtd_pessoas * sausagePerPerson;

    const items: SuggestedItem[] = [
      {
        nome_item: "Picanha",
        quantidade: totalMeat * 0.4,
        unidade: "kg",
        categoria: "Carnes",
        prioridade: 'A',
        valor_estimado: 0,
      },
      {
        nome_item: "Linguiça Toscana",
        quantidade: totalSausage,
        unidade: "kg",
        categoria: "Carnes",
        prioridade: 'A',
        valor_estimado: 0,
      },
      {
        nome_item: "Asa de Frango",
        quantidade: totalMeat * 0.3,
        unidade: "kg",
        categoria: "Carnes",
        prioridade: 'B',
        valor_estimado: 0,
      },
      {
        nome_item: "Pão de Alho",
        quantidade: qtd_pessoas * breadPerPerson,
        unidade: "un",
        categoria: "Acompanhamentos",
        prioridade: 'B',
        valor_estimado: 0,
      },
      {
        nome_item: "Queijo Coalho",
        quantidade: qtd_pessoas * 1,
        unidade: "un",
        categoria: "Acompanhamentos",
        prioridade: 'B',
        valor_estimado: 0,
      },
      {
        nome_item: "Cerveja",
        quantidade: qtd_pessoas * beerPerPerson,
        unidade: "L",
        categoria: "Bebidas",
        prioridade: 'A',
        valor_estimado: 0,
      },
      {
        nome_item: "Refrigerante",
        quantidade: qtd_pessoas * sodaPerPerson,
        unidade: "L",
        categoria: "Bebidas",
        prioridade: 'B',
        valor_estimado: 0,
      },
      {
        nome_item: "Água",
        quantidade: qtd_pessoas * 0.5,
        unidade: "L",
        categoria: "Bebidas",
        prioridade: 'A',
        valor_estimado: 0,
      },
      {
        nome_item: "Carvão",
        quantidade: (totalMeat + totalSausage) * charcoalPerKgOfMeat,
        unidade: "kg",
        categoria: "Utensílios",
        prioridade: 'A',
        valor_estimado: 0,
      },
      {
        nome_item: "Sal Grosso",
        quantidade: 1,
        unidade: "kg",
        categoria: "Temperos",
        prioridade: 'C',
        valor_estimado: 0,
      },
    ];

    // Arredonda as quantidades para cima para fins práticos.
    return items.map(item => ({
      ...item,
      quantidade: Math.ceil(item.quantidade),
    }));
  },
};