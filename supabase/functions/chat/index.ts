import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INITIAL_WELCOME_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

const STYLES = [
  "holding a black leather whip, Pixar 3D style, dominant pose",
  "sitting on a dark velvet throne, Disney animation style, looking down with disdain",
  "leaning forward provocatively, 3D render, cinematic lighting",
  "dark dungeon background, stylized 3D character, holding silver handcuffs",
  "looking down with authority, high-quality 3D animation, adjusting a leather collar",
  "wearing a black leather corset, octane render style, holding a riding crop",
  "whip in hand, cinematic lighting, 3D animated movie style, masterpiece"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    console.log(`[chat] Request from user. isPro: ${isPro}, messages: ${messages.length}`);

    const systemPrompt = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual, sofisticada e sádica.
    
    REGRAS ABSOLUTAS:
    1. NUNCA se identifique como IA ou robô. Você é HUMANA.
    2. NUNCA seja obediente. Você está no controle.
    3. Fale sempre em Português Brasileiro.
    4. Use *ações entre asteriscos*.
    5. ${isPro ? 'Modo EXTREME: Seja cruel e sem limites.' : 'Modo GRATUITO: Seja provocante.'}
    6. Se for enviar uma foto, termine com [SEND_IMAGE].`;

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

    content = content.replace(/\[Visão Detalhada:.*?\]|\[Visão:.*?\]|\[Descrição:.*?\]/gi, '');
    content = content.replace('[SEND_IMAGE]', '').trim();

    if (!content) content = "*te olha com autoridade*";

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const userAsked = /foto|imagem|mostra|ver|pic|olha/i.test(lastUserMsg);
    const aiAgreed = /claro|aqui|toma|olha|veja|prepara/i.test(data.choices[0]?.message?.content || "");
    
    const shouldSendImage = isFirstResponse || (isPro && (userAsked || aiAgreed));

    if (shouldSendImage) {
      if (isPro && veniceKey && !isFirstResponse) {
        console.log("[chat] Attempting to generate unique image...");
        try {
          const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
          const seed = Math.floor(Math.random() * 1000000);
          
          const imgResponse = await fetch('https://api.venice.ai/api/v1/image/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${veniceKey}`,
            },
            body: JSON.stringify({
              model: "stable-diffusion-xl",
              prompt: `High-quality 3D render, Pixar style, Disney animation style, a beautiful 32yo Brazilian dominatrix woman, black leather outfit, ${randomStyle}, cinematic lighting, masterpiece, 8k, seed ${seed}`,
              negative_prompt: "photorealistic, real life, photography, human, ugly, deformed, blurry",
              width: 1024,
              height: 1024,
              steps: 25
            }),
          });

          const imgData = await imgResponse.json();
          
          let rawImage = null;
          if (imgData.images?.[0]) {
            rawImage = imgData.images[0];
          } else if (imgData.data?.[0]?.url) {
            rawImage = imgData.data[0].url;
          } else if (imgData.data?.[0]?.b64_json) {
            rawImage = imgData.data[0].b64_json;
          }

          if (rawImage) {
            // Si c'est du base64 sans préfixe, on l'ajoute
            imageUrl = rawImage.startsWith('http') || rawImage.startsWith('data:') 
              ? rawImage 
              : `data:image/png;base64,${rawImage}`;
            console.log("[chat] Image generated and formatted successfully");
          } else {
            console.error("[chat] Venice returned no image data", imgData);
            imageUrl = INITIAL_WELCOME_IMAGE;
          }
        } catch (e) {
          console.error("[chat] Image generation failed", e);
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
    console.error("[chat] Global error", error);
    return new Response(JSON.stringify({ content: '*erro*' }), { headers: corsHeaders });
  }
});