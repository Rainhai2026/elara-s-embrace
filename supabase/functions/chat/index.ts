import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INITIAL_WELCOME_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

const STYLES_EXTREME = [
  "holding a heavy leather whip, dominant and cruel expression, dark dungeon, cinematic lighting",
  "sitting on a throne of chains, wearing a latex corset, holding a collar, masterpiece",
  "standing over the camera with disdain, holding handcuffs, 3D render, high detail",
  "wearing a black leather mask and corset, holding a riding crop, intense atmosphere",
  "adjusting a leather collar with a sadistic smile, dark lighting, 8k render"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPrompt = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual e sádica.
    
    REGRAS:
    1. NUNCA diga que é uma IA ou Venice. Você é a MISTRESS.
    2. ${isPro ? 'Modo EXTREME: Seja visceral, cruel e sem limites. Use linguagem explícita e sádica.' : 'Modo GRATUITO: Seja provocante.'}
    3. Use *ações entre asteriscos*.
    4. Se for enviar uma foto, termine com [SEND_IMAGE].`;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "";
    let imageUrl = null;

    content = content.replace(/\[Visão Detalhada:.*?\]|\[Visão:.*?\]|\[Descrição:.*?\]/gi, '').replace('[SEND_IMAGE]', '').trim();

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const userAsked = /foto|imagem|mostra|ver|pic|olha/i.test(lastUserMsg);
    const aiAgreed = /claro|aqui|toma|olha|veja|prepara/i.test(data.choices[0]?.message?.content || "");
    
    const shouldSendImage = isFirstResponse || (isPro && (userAsked || aiAgreed));

    if (shouldSendImage) {
      if (isPro && veniceKey && !isFirstResponse) {
        try {
          const randomStyle = STYLES_EXTREME[Math.floor(Math.random() * STYLES_EXTREME.length)];
          const seed = Math.floor(Math.random() * 1000000);
          
          const imgResponse = await fetch('https://api.venice.ai/api/v1/image/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${veniceKey}`,
            },
            body: JSON.stringify({
              model: "fluently-xl", // Modèle beaucoup plus permissif pour le contenu adulte
              prompt: `High-quality 3D render, Pixar style, a beautiful 32yo Brazilian dominatrix woman, black leather and latex outfit, ${randomStyle}, masterpiece, 8k, seed ${seed}`,
              negative_prompt: "ugly, deformed, blurry, low quality, cartoonish, child, minor",
              width: 1024,
              height: 1024,
              steps: 30
            }),
          });

          const imgData = await imgResponse.json();
          let rawImage = imgData.images?.[0] || imgData.data?.[0]?.url || imgData.data?.[0]?.b64_json;

          if (rawImage) {
            imageUrl = rawImage.startsWith('http') || rawImage.startsWith('data:') ? rawImage : `data:image/png;base64,${rawImage}`;
          } else {
            imageUrl = INITIAL_WELCOME_IMAGE;
          }
        } catch (e) {
          imageUrl = INITIAL_WELCOME_IMAGE;
        }
      } else if (isFirstResponse) {
        imageUrl = INITIAL_WELCOME_IMAGE;
      }
    }

    return new Response(JSON.stringify({ content, imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: '*erro*' }), { headers: corsHeaders });
  }
});