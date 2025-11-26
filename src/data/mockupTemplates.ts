export type MockupFormat = 'feed' | 'story' | 'linkedin';

export interface MockupTemplate {
  id: string;
  name: string;
  description: string;
  formats: MockupFormat[];
  defaultTexts: {
    headline?: string;
    subheadline?: string;
    featureTitle?: string;
    problemText?: string;
    solutionText?: string;
    daysRemaining?: string;
    color1?: string;
    color2?: string;
  };
  previewUrl?: string;
}

export const mockupTemplates: Record<string, MockupTemplate> = {
  heroLaunch: {
    id: 'heroLaunch',
    name: 'Hero Launch Image',
    description: 'Imagem principal de lançamento com smartphone e tagline',
    formats: ['feed', 'story'],
    defaultTexts: {
      headline: 'Reúna pessoas, não problemas.',
      subheadline: 'Disponível agora em reuneapp.com.br',
      color1: '#FF6B35',
      color2: '#007A6E'
    }
  },
  
  featureShowcase: {
    id: 'featureShowcase',
    name: 'Feature Showcase - IA',
    description: 'Destaque da funcionalidade de IA conversacional',
    formats: ['feed', 'story', 'linkedin'],
    defaultTexts: {
      headline: 'Converse naturalmente, organize perfeitamente',
      featureTitle: 'IA que entende português natural',
      color1: '#00A8CC',
      color2: '#007A6E'
    }
  },

  countdown: {
    id: 'countdown',
    name: 'Countdown Template',
    description: 'Template de contagem regressiva para lançamento',
    formats: ['feed', 'story'],
    defaultTexts: {
      headline: 'Faltam X dias para revolucionar seus eventos',
      daysRemaining: '15',
      color1: '#FF6B35',
      color2: '#FFC700'
    }
  },

  problemSolution: {
    id: 'problemSolution',
    name: 'Problema vs Solução',
    description: 'Comparação visual antes/depois',
    formats: ['feed', 'story', 'linkedin'],
    defaultTexts: {
      problemText: 'Planejamento confuso e estressante',
      solutionText: 'Organização inteligente com ReUNE',
      color1: '#FF6B35',
      color2: '#007A6E'
    }
  },

  carousel: {
    id: 'carousel',
    name: 'Como Funciona (Carrossel)',
    description: 'Infográfico de 3 passos explicando o app',
    formats: ['feed'],
    defaultTexts: {
      headline: 'Como o ReUNE funciona',
      color1: '#FF6B35',
      color2: '#007A6E'
    }
  }
};

export const formatLabels: Record<MockupFormat, string> = {
  feed: 'Instagram Feed (1080x1350)',
  story: 'Instagram Story (1080x1920)',
  linkedin: 'LinkedIn (1200x628)'
};

export const formatDimensions: Record<MockupFormat, { width: number; height: number }> = {
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  linkedin: { width: 1200, height: 628 }
};
