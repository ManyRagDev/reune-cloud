export interface EventTemplate {
    slug: string;
    title: string;
    description: string;
    defaultItems?: {
        name: string;
        quantity: number;
        unit: string;
        category: string;
    }[];
}

export const templates: EventTemplate[] = [
    {
        slug: "churrasco",
        title: "Churrasco de Amigos",
        description: "Churrasco completo com carnes, bebidas e acompanhamentos para curtir com a galera.",
        defaultItems: [
            { name: "Picanha", quantity: 2, unit: "kg", category: "comida" },
            { name: "Linguiça", quantity: 1, unit: "kg", category: "comida" },
            { name: "Pão de Alho", quantity: 5, unit: "pct", category: "comida" },
            { name: "Carvão", quantity: 1, unit: "sc", category: "geral" },
            { name: "Cerveja", quantity: 24, unit: "lata", category: "bebida" },
            { name: "Refrigerante", quantity: 3, unit: "gf", category: "bebida" },
        ]
    },
    {
        slug: "jantar",
        title: "Jantar em Família",
        description: "Um jantar especial para reunir a família com pratos deliciosos.",
        defaultItems: [
            { name: "Prato Principal", quantity: 1, unit: "un", category: "comida" },
            { name: "Acompanhamento", quantity: 2, unit: "un", category: "comida" },
            { name: "Sobremesa", quantity: 1, unit: "un", category: "comida" },
            { name: "Vinho", quantity: 2, unit: "gf", category: "bebida" },
            { name: "Suco", quantity: 2, unit: "gf", category: "bebida" },
        ]
    },
    {
        slug: "aniversario",
        title: "Aniversário Simples",
        description: "Comemoração de aniversário sem estresse, com bolo e salgadinhos.",
        defaultItems: [
            { name: "Bolo", quantity: 1, unit: "un", category: "comida" },
            { name: "Salgadinhos", quantity: 100, unit: "un", category: "comida" },
            { name: "Docinhos", quantity: 50, unit: "un", category: "comida" },
            { name: "Refrigerante", quantity: 5, unit: "gf", category: "bebida" },
            { name: "Descartáveis", quantity: 1, unit: "kit", category: "geral" },
        ]
    },
    {
        slug: "reuniao",
        title: "Reunião de Equipe",
        description: "Coffee break produtivo para reuniões de trabalho.",
        defaultItems: [
            { name: "Café", quantity: 2, unit: "gf", category: "bebida" },
            { name: "Água", quantity: 5, unit: "gf", category: "bebida" },
            { name: "Biscoitos", quantity: 3, unit: "pct", category: "comida" },
            { name: "Pão de Queijo", quantity: 1, unit: "kg", category: "comida" },
        ]
    }
];
