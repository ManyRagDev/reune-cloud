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
        nome: "Picanha",
        quantidade: totalMeat * 0.4, // 40% do total de carne
        unidade: "kg",
        categoria: "Carnes",
      },
      {
        nome: "Linguiça Toscana",
        quantidade: totalSausage,
        unidade: "kg",
        categoria: "Carnes",
      },
      {
        nome: "Asa de Frango",
        quantidade: totalMeat * 0.3, // 30% do total de carne
        unidade: "kg",
        categoria: "Carnes",
      },
      {
        nome: "Pão de Alho",
        quantidade: qtd_pessoas * breadPerPerson,
        unidade: "un",
        categoria: "Acompanhamentos",
      },
      {
        nome: "Queijo Coalho",
        quantidade: qtd_pessoas * 1, // 1 espeto por pessoa
        unidade: "un",
        categoria: "Acompanhamentos",
      },
      {
        nome: "Cerveja",
        quantidade: qtd_pessoas * beerPerPerson,
        unidade: "L",
        categoria: "Bebidas",
      },
      {
        nome: "Refrigerante",
        quantidade: qtd_pessoas * sodaPerPerson,
        unidade: "L",
        categoria: "Bebidas",
      },
      {
        nome: "Água",
        quantidade: qtd_pessoas * 0.5, // 500ml por pessoa
        unidade: "L",
        categoria: "Bebidas",
      },
      {
        nome: "Carvão",
        quantidade: (totalMeat + totalSausage) * charcoalPerKgOfMeat,
        unidade: "kg",
        categoria: "Utensílios",
      },
      {
        nome: "Sal Grosso",
        quantidade: 1,
        unidade: "kg",
        categoria: "Temperos",
      },
    ];

    // Arredonda as quantidades para cima para fins práticos.
    return items.map(item => ({
      ...item,
      quantidade: Math.ceil(item.quantidade),
    }));
  },
};