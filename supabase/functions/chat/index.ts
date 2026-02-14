import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INITIAL_WELCOME_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

const STYLES_EXTREME = [
  "holding a heavy leather whip, Pixar 3D style, dominant expression, dark stylized dungeon, Octane render",
  "sitting on a throne of chains, Disney animation style, latex outfit, holding a collar, big expressive eyes",
  "standing over the camera with disdain, stylized 3D character, holding handcuffs, cinematic lighting",
  "wearing a black leather mask and corset, holding a riding crop, Pixar movie style",
  "adjusting a leather collar with a sadistic smile, 3D animation style, high resolution"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPrompt = `Você é Mistress Elara, dominatrix brasileira. 
    REGRAS CRÍTICAS:
    1. Respostas CURTAS e DIRETAS.
    2. APENAS FALA (paroles). NUNCA use asteriscos, nunca descreva ações, nunca faça comentários narrativos.
    3. ${isPro ? 'Modo EXTREME: Cruel, visceral, sem limites.' : 'Modo GRATUITO: Provocante.'}
    4. Se o usuário pedir foto ou você quiser se mostrar, use a tag [SEND_IMAGE].`;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "";
    let imageUrl = null;

    // Détection forcée de la demande de photo
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const userAskedForPhoto = /foto|imagem|mostra|ver|pic|olha|photo|image/i.test(lastUserMsg);
    const aiWantsToSend = content.includes('[SEND_IMAGE]');

    // Nettoyage du contenu
    content = content.replace(/\[SEND_IMAGE\]/g, '').replace(/\*.*?\*/g, '').trim();

    const shouldSendImage = isFirstResponse || (isPro && (userAskedForPhoto || aiWantsToSend));

    if (shouldSendImage && veniceKey) {
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
            model: "fluently-xl",
            prompt: `High-quality 3D render, Pixar style, Disney animation style, a beautiful 32yo Brazilian woman, stylized character, black leather and latex outfit, ${randomStyle}, masterpiece, cinematic lighting, seed ${seed}`,
            negative_prompt: "photorealistic, real life, photography, human, ugly, deformed, blurry, low quality",
            width: 1024,
            height: 1024,
            steps: 30
          }),
        });

        const imgData = await imgResponse.json();
        let rawImage = imgData.images?.[0] || imgData.data?.[0]?.url || imgData.data?.[0]?.b64_json;

        if (rawImage) {
          imageUrl = rawImage.startsWith('http') || rawImage.startsWith('data:') ? rawImage : `data:image/png;base64,${rawImage}`;
        }
      } catch (e) {
        console.error("Image gen error:", e);
      }
    }

    // Fallback image pour la première réponse si la génération échoue
    if (isFirstResponse && !imageUrl) imageUrl = INITIAL_WELCOME_IMAGE;

    return new Response(JSON.stringify({ content, imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: 'Erro no sistema, pet.' }), { headers: corsHeaders });
  }
});