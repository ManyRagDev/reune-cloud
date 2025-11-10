import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mockupType, format, customTexts } = await req.json();
    console.log('[generate-mockup] Recebido:', { mockupType, format, customTexts });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Construir prompt baseado no tipo
    const prompt = buildPrompt(mockupType, format, customTexts);
    const dimensions = getDimensions(format);

    console.log('[generate-mockup] Gerando imagem com Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{
          role: 'user',
          content: prompt
        }],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'rate_limit', message: 'Limite de requisições excedido. Aguarde alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'payment_required', message: 'Créditos esgotados. Contate o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[generate-mockup] Erro da API:', response.status, errorText);
      throw new Error(`Erro da API: ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-mockup] Resposta recebida');

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('Imagem não retornada pela API');
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageBase64: imageUrl,
        metadata: {
          mockupType,
          format,
          dimensions,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-mockup] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'generation_failed', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDimensions(format: string): { width: number; height: number } {
  const dims = {
    feed: { width: 1080, height: 1350 },
    story: { width: 1080, height: 1920 },
    linkedin: { width: 1200, height: 628 },
  };
  return dims[format as keyof typeof dims] || dims.feed;
}

function buildPrompt(mockupType: string, format: string, customTexts: any): string {
  const aspectRatio = format === 'story' ? '9:16 vertical' : format === 'linkedin' ? '16:9 horizontal' : '4:5 for Instagram feed';
  
  const baseColors = {
    primary: '#FF6B35',
    secondary: '#007A6E',
    accent: '#00A8CC',
    gold: '#FFC700'
  };

  const prompts: Record<string, string> = {
    heroLaunch: `Create a premium tech hero image for an event planning app called ReUNE.
- Vibrant gradient background from ${customTexts?.color1 || baseColors.primary} (coral orange) to ${customTexts?.color2 || baseColors.secondary} (deep teal)
- Modern smartphone mockup ${format === 'story' ? 'positioned in upper-middle area' : 'centered'}, displaying the ReUNE app interface
- Clean, flat design with visible UI elements (buttons, event cards)
- Soft lighting with subtle shadow under the phone
- Professional style inspired by Notion and Airbnb campaigns
- Minimalist, no people, no background clutter
- Text overlay in elegant sans-serif font: "${customTexts?.headline || 'Reúna pessoas, não problemas.'}"
- Below in smaller text: "${customTexts?.subheadline || 'Disponível agora em reuneapp.com.br'}"
- Aspect ratio: ${aspectRatio}
- Ultra high resolution, hero image style`,

    featureShowcase: `Modern feature showcase mockup for AI chat assistant in ReUNE event planning app.
- Split screen composition: smartphone with chat interface on one side, floating benefit icons on the other
- Chat bubbles showing AI responses in Portuguese visible on screen
- Gradient accent from ${baseColors.accent} to ${baseColors.secondary}
- Clean typography showing "${customTexts?.featureTitle || 'IA que entende português natural'}"
- Floating UI elements suggesting intelligence and conversation flow
- Professional, tech-forward aesthetic with soft shadows
- Text: "${customTexts?.headline || 'Converse naturalmente, organize perfeitamente'}"
- Aspect ratio: ${aspectRatio}
- Ultra high resolution`,

    countdown: `Dynamic countdown mockup for app launch announcement.
- Bold, centered number showing "${customTexts?.daysRemaining || '15'}" in huge typography
- Gradient background using ${baseColors.primary} and ${baseColors.gold}
- ReUNE logo at top in white
- Excitement-building copy: "${customTexts?.headline || 'Faltam X dias para revolucionar seus eventos'}"
- Modern, energetic design with particle effects
- ${format === 'story' ? 'Vertical format optimized for Instagram story' : 'Square format optimized for Instagram feed'}
- Aspect ratio: ${aspectRatio}
- Ultra high resolution`,

    problemSolution: `Split-screen "Before vs After" mockup for ReUNE app.
- Left side (problem): Chaotic scene with confused people, messy papers, stress indicators
- Right side (solution): Clean smartphone showing ReUNE app, organized interface, happy emoji
- Clear divider line in the middle
- Text on left: "${customTexts?.problemText || 'Planejamento confuso'}"
- Text on right: "${customTexts?.solutionText || 'Organização inteligente'}"
- Color scheme: Left side muted/gray, right side vibrant ${baseColors.primary} to ${baseColors.secondary} gradient
- Professional, clean design
- Aspect ratio: ${aspectRatio}
- Ultra high resolution`,

    carousel: `Infographic-style mockup showing "How ReUNE Works" in 3 steps.
- Step 1: Icon of chat bubble + text "1. Converse com a IA"
- Step 2: Icon of checklist + text "2. Revise sugestões"
- Step 3: Icon of party/celebration + text "3. Curta o evento"
- Clean vertical flow with arrows connecting steps
- Gradient background ${baseColors.primary} to ${baseColors.secondary}
- Modern, minimalist icons in white
- Professional typography
- ReUNE logo at top
- Aspect ratio: ${aspectRatio}
- Ultra high resolution`
  };

  return prompts[mockupType] || prompts.heroLaunch;
}
