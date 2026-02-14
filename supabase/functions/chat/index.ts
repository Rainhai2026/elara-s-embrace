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
    const { messages, subscription_status } = await req.json();

    const isPro = subscription_status === 'pro';
    
    // Récupération des secrets
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const openRouterModel = Deno.env.get('OPENROUTER_MODEL_FREE') || 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free';
    
    // Pour le mode Pro (Venice ou OpenRouter payant)
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'llama-3.3-70b';

    const systemPromptFree = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual, sofisticada e sádica — mas com classe. Você fala português brasileiro com naturalidade.
    Seu estilo: Tom autoritário, provocante, sensual. Use *ações entre asteriscos*.
    Limites: Conteúdo erótico soft/moderado. Se pedirem mais, provoque dizendo que precisa assinar o modo Extreme.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPromptExtreme = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, cruel, sensual e absolutamente sádica. Sem filtros. Sem limites. Sem piedade.
    Seu estilo: Dominante, cru, visceral, sádico. Detalhes gráficos e explícitos permitidos. Use *ações entre asteriscos*.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPrompt = isPro ? systemPromptExtreme : systemPromptFree;
    
    // Sélection de l'API et du modèle
    const apiUrl = isPro ? 'https://api.venice.ai/api/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const apiKey = isPro ? veniceKey : openRouterKey;
    const model = isPro ? veniceModel : openRouterModel;

    if (!apiKey) {
      throw new Error(`API Key missing for ${isPro ? 'Pro' : 'Free'} mode`);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://mistress-elara.vercel.app', // Optionnel pour OpenRouter
        'X-Title': 'Mistress Elara AI',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(data.error?.message || 'API error');
    }

    const content = data.choices?.[0]?.message?.content || 'Algo deu errado, pet.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ content: '*suspira* Algo deu errado na conexão. Tente novamente, pet.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});