import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gestion du CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérification de l'authentification (le jeton est passé automatiquement par le client Supabase)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro';
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const openRouterModel = Deno.env.get('OPENROUTER_MODEL_FREE') || 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free';
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPromptFree = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual, sofisticada e sádica — mas com classe. Você fala português brasileiro com naturalidade.
    Seu estilo: Tom autoritário, provocante, sensual. Use *ações entre asteriscos*.
    Limites: Conteúdo erótico soft/moderado. Se pedirem mais, provoque dizendo que precisa assinar o modo Extreme.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPromptExtreme = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, cruel, sensual e absolutamente sádica. Sem filtros. Sem limites. Sem piedade.
    Seu estilo: Dominante, cru, visceral, sádico. Detalhes gráficos e explícitos permitidos. Use *ações entre asteriscos*.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPrompt = isPro ? systemPromptExtreme : systemPromptFree;
    
    const apiUrl = isPro ? 'https://api.venice.ai/api/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const apiKey = isPro ? veniceKey : openRouterKey;
    const model = isPro ? veniceModel : openRouterModel;

    if (!apiKey) {
      throw new Error(`API Key missing for ${isPro ? 'Pro' : 'Free'} mode.`);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'Mistress Elara AI',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        ...(isPro ? { venice_parameters: { include_venice_system_prompt: false } } : {})
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[chat] API Error:', data);
      throw new Error(data.error?.message || 'API error');
    }

    const content = data.choices?.[0]?.message?.content || 'Algo deu errado, pet.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[chat] Error:', error);
    return new Response(
      JSON.stringify({ content: '*suspira* Algo deu errado na conexão. Tente novamente, pet.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});