import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Liste de teasers pour varier les plaisirs en mode gratuit
const TEASER_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', // Fashion/Sensual 1
  'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=800', // Fashion/Sensual 2
  'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg' // L'image originale
];

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
    Sempre que o usuário pedir para ver você, envie o teaser para deixá-lo com vontade.`;

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

    const lowerContent = content.toLowerCase();
    const hasImageTag = content.includes('[SEND_IMAGE]');
    const mentionsImage = /foto|imagem|teaser|veja minha|olhe para mim/i.test(lowerContent);
    
    if (hasImageTag || mentionsImage) {
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
              prompt: "Professional photo of a beautiful 32yo Brazilian dominatrix, sophisticated, authoritative, sensual, high quality, realistic, cinematic lighting",
              negative_prompt: "ugly, deformed, blurry, low quality, cartoon, 3d",
              width: 1024,
              height: 1024,
              steps: 30,
              hide_watermark: true
            }),
          });
          const imgData = await imgResponse.json();
          imageUrl = imgData.images?.[0] || TEASER_IMAGES[0];
        } catch (e) {
          imageUrl = TEASER_IMAGES[Math.floor(Math.random() * TEASER_IMAGES.length)];
        }
      } else {
        // Sélection aléatoire d'un teaser pour le mode gratuit
        imageUrl = TEASER_IMAGES[Math.floor(Math.random() * TEASER_IMAGES.length)];
      }
    }

    return new Response(JSON.stringify({ content, imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: '*erro*' }), { headers: corsHeaders });
  }
});