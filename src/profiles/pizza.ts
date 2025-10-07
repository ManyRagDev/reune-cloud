import { EventProfile } from '@/types/domain';

export const pizzaProfile: EventProfile = {
  key: 'pizza',
  aliases: ['noite de pizza', 'pizzada'],
  items: [
    // Pizzas
    { name: 'Pizza de Calabresa', quantity: 1, unit: 'un', category: 'Comida', per_person: 0.5 },
    { name: 'Pizza de Mussarela', quantity: 1, unit: 'un', category: 'Comida', per_person: 0.5 },
    { name: 'Pizza de Frango com Catupiry', quantity: 1, unit: 'un', category: 'Comida', per_person: 0.25 },
    { name: 'Pizza Doce (Chocolate/Romeu e Julieta)', quantity: 1, unit: 'un', category: 'Comida', per_person: 0.25 },

    // Bebidas
    { name: 'Refrigerante (2L)', quantity: 1, unit: 'un', category: 'Bebida', per_person: 0.5 },
    { name: 'Suco (1L)', quantity: 1, unit: 'un', category: 'Bebida', per_person: 0.3 },
    { name: 'Água (1.5L)', quantity: 1, unit: 'un', category: 'Bebida', per_person: 0.5 },
    { name: 'Cerveja (lata)', quantity: 3, unit: 'un', category: 'Bebida', per_person: 3 },

    // Descartáveis
    { name: 'Pratos descartáveis', quantity: 1, unit: 'pacote', category: 'Descartáveis', per_person: 1.5 },
    { name: 'Copos descartáveis', quantity: 1, unit: 'pacote', category: 'Descartáveis', per_person: 2 },
    { name: 'Guardanapos', quantity: 1, unit: 'pacote', category: 'Descartáveis', per_person: 5 },
  ],
};