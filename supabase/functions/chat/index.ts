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

    // Récupération des secrets depuis Supabase
    const apiKey = Deno.env.get('VENICE_API_KEY');
    const modelFree = Deno.env.get('VENICE_MODEL_FREE') || 'llama-3.3-70b';
    const modelPro = Deno.env.get('VENICE_MODEL_PRO') || 'llama-3.3-70b';

    const systemPromptFree = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual, sofisticada e sádica — mas com classe. Você fala português brasileiro com naturalidade.
    Seu estilo: Tom autoritário, provocante, sensual. Use *ações entre asteriscos*.
    Limites: Conteúdo erótico soft/moderado. Se pedirem mais, provoque dizendo que precisa assinar o modo Extreme.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPromptExtreme = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, cruel, sensual e absolutamente sádica. Sem filtros. Sem limites. Sem piedade.
    Seu estilo: Dominante, cru, visceral, sádico. Detalhes gráficos e explícitos permitidos. Use *ações entre asteriscos*.
    SAFE-WORDS: VERMELHO (parar), AMARELO (reduzir).`;

    const systemPrompt = subscription_status === 'pro' ? systemPromptExtreme : systemPromptFree;
    const model = subscription_status === 'pro' ? modelPro : modelFree;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        venice_parameters: {
          include_venice_system_prompt: false
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Venice API Error:', data);
      throw new Error(data.error?.message || 'Venice API error');
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