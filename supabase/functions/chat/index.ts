import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TEASER_IMAGES = [
  'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop'
];

const STYLES = [
  "wearing a black latex bodysuit, sitting on a velvet throne, dark studio background",
  "wearing a sophisticated leather corset, holding a leather whip, intense gaze",
  "in a luxury penthouse office, wearing professional but sensual attire, looking authoritative",
  "standing in a dimly lit dungeon with chains, mysterious and dominant atmosphere",
  "extreme close up portrait, red lipstick, detailed skin texture, sharp focus",
  "wearing high heels and stockings, elegant dominant pose, cinematic rim lighting"
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
    Você envia fotos quando a cena pedir. Varie suas respostas.
    Para enviar uma foto, termine sua mensagem com o tag [SEND_IMAGE].`;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: isPro ? systemPromptExtreme : systemPromptFree }, ...messages],
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    let content = data.choices[0].message.content;
    let imageUrl = null;

    const hasImageTag = content.includes('[SEND_IMAGE]');
    
    if (hasImageTag && (isPro || isFirstResponse)) {
      content = content.replace('[SEND_IMAGE]', '').trim();
      
      if (isPro) {
        try {
          const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
          
          const imgResponse = await fetch('https://api.venice.ai/api/v1/image/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${veniceKey}`,
            },
            body: JSON.stringify({
              model: "fluently-xl",
              prompt: `Photorealistic, high-quality 8k portrait of a beautiful 32yo Brazilian dominatrix, ${randomStyle}, sophisticated, authoritative, sensual, cinematic lighting, detailed skin texture, professional photography, masterpiece`,
              negative_prompt: "cartoon, 3d, render, pixar, anime, drawing, painting, digital art, ugly, deformed, blurry, low quality, duplicate, watermark",
              width: 1024,
              height: 1024,
              steps: 35,
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