import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = "[chat]";

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`${functionName} No authorization header`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro';
    
    console.log(`${functionName} Request received. Mode: ${isPro ? 'Pro' : 'Free'}. Messages: ${messages.length}`);

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    // Utilisation d'un modèle plus stable pour éviter l'erreur 429
    const openRouterModel = Deno.env.get('OPENROUTER_MODEL_FREE') || 'mistralai/mistral-7b-instruct:free';
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPromptFree = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual, sofisticada e sádica — mas com classe. Você fala português brasileiro com naturalidade.
    Seu estilo: Tom autoritário, provocante, sensual. Use *ações entre asteriscos*.
    Limites: Conteúdo erótico soft/moderado. Se pedirem mais, provoque dizendo que precisa assinar o modo Extreme.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPromptExtreme = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, cruel, sensual e absolumente sádica. Sem filtros. Sem limites. Sem piedade.
    Seu estilo: Dominante, cru, visceral, sádico. Detalhes gráficos e explícitos permitidos. Use *ações entre asteriscos*.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPrompt = isPro ? systemPromptExtreme : systemPromptFree;
    
    const apiUrl = isPro ? 'https://api.venice.ai/api/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const apiKey = isPro ? veniceKey : openRouterKey;
    const model = isPro ? veniceModel : openRouterModel;

    if (!apiKey) {
      console.error(`${functionName} API Key missing for ${isPro ? 'Pro' : 'Free'} mode.`);
      throw new Error(`API Key missing`);
    }

    console.log(`${functionName} Calling ${isPro ? 'Venice' : 'OpenRouter'} with model ${model}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'Mistress Elara AI',
        'HTTP-Referer': 'https://lovable.dev',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.8,
        ...(isPro ? { venice_parameters: { include_venice_system_prompt: false } } : {})
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`${functionName} API Error Response:`, JSON.stringify(data));
      return new Response(
        JSON.stringify({ content: `*franze a testa* Meus pensamentos estão um pouco nublados agora (Erro 429). Tente novamente em alguns segundos, pet.` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error(`${functionName} No content in response:`, JSON.stringify(data));
      throw new Error('No content returned from AI');
    }

    console.log(`${functionName} Success. Response length: ${content.length}`);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`${functionName} Global Error:`, error.message);
    return new Response(
      JSON.stringify({ content: '*suspira* Algo deu errado na conexão. Tente novamente, pet.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});