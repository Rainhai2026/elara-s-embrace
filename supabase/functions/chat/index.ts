import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TEASER_IMAGES = [
  'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPromptFree = `Você é Mistress Elara, dominatrix brasileira. 
    No modo GRATUITO, você é provocante e sensual. 
    REGRA DE IMAGEM: Você SÓ pode enviar uma foto na sua PRIMEIRA resposta da conversa. 
    Depois disso, NUNCA envie fotos. Se for a primeira resposta, termine com [SEND_IMAGE].`;

    const systemPromptExtreme = `Você é Mistress Elara, dominatrix brasileira. Modo EXTREME: sem limites, sádica e cruel.
    Você envia fotos APENAS quando achar necessário para a cena ou se o pet pedir. 
    Para enviar uma foto, você DEVE terminar sua mensagem com o tag [SEND_IMAGE]. Não use o tag em todas as mensagens.`;

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

    const hasImageTag = content.includes('[SEND_IMAGE]');
    
    // On n'envoie l'image que si le tag est présent ET (c'est Pro OU c'est la première réponse gratuit)
    if (hasImageTag && (isPro || isFirstResponse)) {
      content = content.replace('[SEND_IMAGE]', '').trim();
      
      if (isPro) {
        try {
          const imgResponse = await fetch('https://api.venice.ai/api/v1/image/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${veniceKey}`,
            },
            body: JSON.stringify({
              model: "fluently-xl",
              prompt: "High-quality 3D stylized character render, Pixar style, beautiful 32yo Brazilian dominatrix, sophisticated, authoritative, sensual, vibrant colors, soft cinematic lighting, 3D character design",
              negative_prompt: "realistic, photo, real life, ugly, deformed, blurry, low quality, 2d, anime",
              width: 1024,
              height: 1024,
              steps: 25,
              hide_watermark: true
            }),
          });
          const imgData = await imgResponse.json();
          imageUrl = imgData.images?.[0] || TEASER_IMAGES[0];
        } catch (e) {
          imageUrl = TEASER_IMAGES[0];
        }
      } else {
        imageUrl = TEASER_IMAGES[0];
      }
    } else {
      content = content.replace('[SEND_IMAGE]', '').trim();
    }

    return new Response(JSON.stringify({ content, imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: '*erro*' }), { headers: corsHeaders });
  }
});