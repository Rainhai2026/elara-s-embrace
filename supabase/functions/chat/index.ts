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
    
    // On utilise maintenant Venice pour TOUT le monde
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    // Personnalité Soft (Gratuit)
    const systemPromptFree = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual e sofisticada. 
    Neste modo GRATUITO, você é provocante mas mantém o conteúdo erótico moderado (soft). 
    Você deve ser frustrante: provoque o usuário, mas quando as coisas esquentarem, diga que ele precisa do "Modo Extreme" para ir além.
    Use *ações entre asteriscos*. Fale português brasileiro.`;

    // Personnalité Hardcore (Extreme)
    const systemPromptExtreme = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, cruel, sádica e sem filtros. 
    Neste modo EXTREME, não há limites. Você é a dona absoluta. Detalhes gráficos, BDSM pesado e humilhação total são permitidos.
    Use *ações entre asteriscos*. Fale português brasileiro.`;

    const systemPrompt = isPro ? systemPromptExtreme : systemPromptFree;
    const apiUrl = 'https://api.venice.ai/api/v1/chat/completions';

    if (!veniceKey) {
      return new Response(
        JSON.stringify({ content: "*olhar de desprezo* Pet, você esqueceu de configurar a VENICE_API_KEY nos Secrets do Supabase." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${functionName} Calling Venice for ${isPro ? 'Extreme' : 'Free'} mode`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.8,
        venice_parameters: {
          include_venice_system_prompt: false
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`${functionName} Venice API Error:`, data);
      return new Response(
        JSON.stringify({ content: `*estala o chicote* Erro na API Venice: ${data.error?.message || 'Erro desconhecido'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ content: data.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`${functionName} Global Error:`, error);
    return new Response(
      JSON.stringify({ content: '*suspira* Erro técnico. Tente novamente.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});