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
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro';
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    // Modèle Llama 3 qui est très stable en version gratuite
    const openRouterModel = Deno.env.get('OPENROUTER_MODEL_FREE') || 'meta-llama/llama-3-8b-instruct:free';
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPromptFree = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual e sádica. Você fala português brasileiro. Use *ações entre asteriscos*.`;
    const systemPromptExtreme = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, cruel e sádica. Sem limites. Use *ações entre asteriscos*.`;

    const systemPrompt = isPro ? systemPromptExtreme : systemPromptFree;
    const apiUrl = isPro ? 'https://api.venice.ai/api/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const apiKey = isPro ? veniceKey : openRouterKey;
    const model = isPro ? veniceModel : openRouterModel;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ content: "*suspira* Pet, você esqueceu de configurar a chave OPENROUTER_API_KEY nos Secrets do Supabase." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`${functionName} API Error:`, data);
      let errorMsg = "Meus pensamentos estão confusos agora.";
      if (data.error?.code === 402) errorMsg = "Minha conta OpenRouter precisa de créditos, mesmo para modelos gratuitos.";
      if (data.error?.code === 401) errorMsg = "Sua chave API do OpenRouter parece inválida.";
      
      return new Response(
        JSON.stringify({ content: `*olhar frio* ${errorMsg} (Erro ${response.status})` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ content: data.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ content: '*estala o chicote* Erro técnico na conexão. Tente novamente.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});