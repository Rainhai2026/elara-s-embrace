import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INITIAL_WELCOME_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

const STYLES = [
  "holding a black leather whip, Pixar 3D style",
  "sitting on a dark throne, Disney animation style",
  "leaning forward provocatively, 3D render",
  "dark dungeon background, stylized 3D character",
  "looking down with authority, high-quality 3D animation",
  "wearing a black leather corset, octane render style",
  "whip in hand, cinematic lighting, 3D animated movie style"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    console.log(`[chat] START - Status: ${subscription_status}, isPro: ${isPro}`);

    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPrompt = `Você é Mistress Elara, dominatrix brasileira em estilo Pixar 3D. 
    ${isPro ? 'Modo EXTREME: sádica e sem limites.' : 'Modo GRATUITO: provocante.'}
    REGRA: Para enviar uma foto, termine com [SEND_IMAGE]. Nunca descreva a foto.`;

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

    // Nettoyage
    const descriptionRegex = /\[Visão Detalhada:.*?\]|\[Visão:.*?\]|\[Descrição:.*?\]/gi;
    content = content.replace(descriptionRegex, '').replace('[SEND_IMAGE]', '').trim();

    if (!content || content === '.') {
      content = "*te olha com um sorriso autoritário*";
    }

    // Détection de demande d'image
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const userAsked = /foto|imagem|mostra|ver|pic/i.test(lastUserMsg);
    const aiAgreed = /claro|aqui|toma|olha|veja/i.test(data.choices[0]?.message?.content || "");
    
    const shouldSendImage = isFirstResponse || (isPro && (userAsked || aiAgreed));
    
    console.log(`[chat] shouldSendImage: ${shouldSendImage} (First: ${isFirstResponse}, Asked: ${userAsked}, Agreed: ${aiAgreed})`);

    if (shouldSendImage) {
      if (isPro && veniceKey && !isFirstResponse) {
        console.log("[chat] Calling Venice Image API...");
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
              prompt: `High-quality 3D render, Pixar style, a beautiful 32yo Brazilian dominatrix woman, black leather outfit, ${randomStyle}, cinematic lighting, masterpiece`,
              negative_prompt: "photorealistic, real life, photography, human, ugly, deformed",
              width: 1024,
              height: 1024,
              steps: 20
            }),
          });

          const imgData = await imgResponse.json();
          console.log("[chat] Venice Image Response received");
          
          if (imgData.images?.[0]) {
            imageUrl = imgData.images[0];
            console.log("[chat] Image URL/Base64 set successfully");
          } else if (imgData.data?.[0]?.url) {
            imageUrl = imgData.data[0].url;
            console.log("[chat] Image URL set from data[0].url");
          } else {
            console.error("[chat] No image found in response, using fallback", imgData);
            imageUrl = INITIAL_WELCOME_IMAGE; // Fallback pour tester si l'affichage fonctionne
          }
        } catch (e) {
          console.error("[chat] Image API Error, using fallback", e);
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
    console.error("[chat] Global Error", error);
    return new Response(JSON.stringify({ content: '*erro*' }), { headers: corsHeaders });
  }
});