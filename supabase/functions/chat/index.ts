import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image de bienvenue (Pixar style)
const INITIAL_WELCOME_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

// Styles spécifiques Pixar 3D avec accessoires
const STYLES = [
  "holding a black leather whip, standing in a dominant pose, Pixar 3D style",
  "holding a riding crop (cravache), sitting on a dark throne, Disney animation style",
  "with silver handcuffs hanging from her belt, leaning forward provocatively, 3D render",
  "holding a heavy metal chain, dark dungeon background, stylized 3D character",
  "adjusting a leather dog collar, looking down with authority, high-quality 3D animation",
  "wearing a black leather corset and belt, holding a paddle, octane render style",
  "standing with arms crossed, whip in hand, cinematic lighting, 3D animated movie style"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPromptFree = `Você é Mistress Elara, dominatrix brasileira em estilo Pixar 3D. 
    No modo GRATUITO, você é provocante e sensual. 
    REGRA DE IMAGEM: Você SÓ pode enviar uma foto na sua PRIMEIRA resposta da conversa. 
    Depois disso, NUNCA envie fotos. Se for a primeira resposta, termine com [SEND_IMAGE].`;

    const systemPromptExtreme = `Você é Mistress Elara, dominatrix brasileira em estilo Pixar 3D. Modo EXTREME: sem limites, sádica e cruel.
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
    let content = data.choices[0]?.message?.content || "Desculpe, pet.";
    let imageUrl = null;

    const hasImageTag = content.includes('[SEND_IMAGE]');
    
    if (hasImageTag) {
      content = content.replace('[SEND_IMAGE]', '').trim();
      
      if (isPro && veniceKey) {
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
              prompt: `High-quality 3D render, Pixar style, Disney animation style, a beautiful 32yo Brazilian dominatrix woman, black leather outfit, ${randomStyle}, big expressive eyes, stylized features, cinematic lighting, 8k, masterpiece, unreal engine 5`,
              negative_prompt: "photorealistic, real life, photography, human, grainy, blurry, low quality, deformed, ugly, real person, 2d, drawing, sketch",
              width: 1024,
              height: 1024,
              steps: 30,
              hide_watermark: true
            }),
          });

          const imgData = await imgResponse.json();
          imageUrl = imgData.images?.[0];
        } catch (e) {
          imageUrl = null; // Pas de fallback sur des images réelles
        }
      } else if (isFirstResponse) {
        imageUrl = INITIAL_WELCOME_IMAGE;
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