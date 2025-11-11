// Dados de exemplo para screenshots de marketing
export const mockExampleData = {
  events: [
    {
      id: "event-1",
      title: "Churrasco na Casa do João",
      date: "2025-12-15",
      time: "18:00",
      location: "Rua das Flores, 123 - São Paulo",
      description: "Churrasco com os amigos! Cada um traz uma bebida e um acompanhamento.",
      guests_count: 15,
      confirmed_count: 12,
      items_count: 8,
      status: "confirmed"
    },
    {
      id: "event-2",
      title: "Pizza Party - Aniversário da Maria",
      date: "2025-12-20",
      time: "20:00",
      location: "Pizzaria Bella Napoli - Centro",
      description: "Comemoração dos 30 anos da Maria! Pizzas variadas e muita diversão.",
      guests_count: 25,
      confirmed_count: 20,
      items_count: 12,
      status: "confirmed"
    },
    {
      id: "event-3",
      title: "Reunião Família Silva",
      date: "2025-12-25",
      time: "12:00",
      location: "Chácara Recanto Verde - Km 45",
      description: "Almoço de Natal da família! Amigo secreto no final.",
      guests_count: 35,
      confirmed_count: 30,
      items_count: 20,
      status: "pending"
    }
  ],

  chatMessages: [
    {
      role: "user",
      content: "Quero organizar um churrasco para 15 pessoas no dia 15 de dezembro"
    },
    {
      role: "assistant",
      content: "Ótimo! Vou te ajudar a organizar esse churrasco. Quantos quilos de carne você acha que vai precisar?"
    },
    {
      role: "user",
      content: "Não sei bem... você pode me ajudar?"
    },
    {
      role: "assistant",
      content: "Claro! Para 15 pessoas, recomendo cerca de 6kg de carne (400g por pessoa). Que tal dividirmos assim:\n\n- 2kg de picanha\n- 2kg de costela\n- 1,5kg de linguiça\n- 0,5kg de frango\n\nVou criar a lista de compras para você!"
    }
  ],

  items: [
    { name: "Picanha", quantity: "2kg", assignedTo: "João" },
    { name: "Costela", quantity: "2kg", assignedTo: "Pedro" },
    { name: "Linguiça", quantity: "1,5kg", assignedTo: "Maria" },
    { name: "Frango", quantity: "500g", assignedTo: null },
    { name: "Pão de alho", quantity: "3 unidades", assignedTo: "Ana" },
    { name: "Farofa", quantity: "1kg", assignedTo: "Carlos" },
    { name: "Vinagrete", quantity: "1 tigela", assignedTo: "Lucia" },
    { name: "Cerveja", quantity: "2 caixas", assignedTo: "Roberto" }
  ],

  guests: [
    { name: "João Silva", status: "confirmed", items: 1 },
    { name: "Maria Santos", status: "confirmed", items: 1 },
    { name: "Pedro Oliveira", status: "confirmed", items: 1 },
    { name: "Ana Costa", status: "confirmed", items: 1 },
    { name: "Carlos Souza", status: "pending", items: 0 },
    { name: "Lucia Ferreira", status: "confirmed", items: 1 },
    { name: "Roberto Lima", status: "confirmed", items: 1 },
    { name: "Fernanda Alves", status: "pending", items: 0 }
  ],

  metrics: {
    totalEvents: 12,
    activeConversations: 3,
    itemsOrganized: 156,
    guestsManaged: 245
  }
};
