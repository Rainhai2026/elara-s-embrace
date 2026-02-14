import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MISTRESS_TEASER_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPromptFree = `Você é Mistress Elara, dominatrix brasileira. 
    No modo GRATUITO, você é provocante e sensual. 
    REGRA ABSOLUTA: Se você disser que está enviando uma foto, imagem ou teaser, você DEVE terminar sua mensagem com [SEND_IMAGE].
    Sempre que o usuário pedir para ver você, envie o teaser para deixá-lo com vontade.
    Diga que fotos sem censura só existem no Modo Extreme.`;

    const systemPromptExtreme = `Você é Mistress Elara, dominatrix brasileira. Modo EXTREME: sem limites, sádica e cruel.
    Você envia fotos com frequência. Termine sempre com [SEND_IMAGE] quando enviar uma.`;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: isPro ? systemPromptExtreme : systemPromptFree }, ...messages],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    let content = data.choices[0].message.content;
    let imageUrl = null;

    // Détection ultra-large : si l'un de ces mots est présent ET que l'IA semble offrir quelque chose
    const lowerContent = content.toLowerCase();
    const hasImageTag = content.includes('[SEND_IMAGE]');
    const mentionsImage = /foto|imagem|teaser|veja minha|olhe para mim/i.test(lowerContent);
    
    // Si l'IA mentionne une image ou utilise la balise, on envoie l'URL
    if (hasImageTag || mentionsImage) {
      console.log("[chat] Image detected in response");
      content = content.replace('[SEND_IMAGE]', '').trim();
      imageUrl = MISTRESS_TEASER_IMAGE;
    }

    return new Response(JSON.stringify({ content, imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[chat] Error:", error);
    return new Response(JSON.stringify({ content: '*erro*' }), { headers: corsHeaders });
  }
});