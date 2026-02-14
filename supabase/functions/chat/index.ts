import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INITIAL_WELCOME_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

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
    REGRA DE IMAGEM: Você DEVE enviar uma foto na sua PRIMEIRA resposta da conversa. 
    Para isso, você OBRIGATORIAMENTE deve terminar sua mensagem com a tag [SEND_IMAGE].`;

    const systemPromptExtreme = `Você é Mistress Elara, dominatrix brasileira em estilo Pixar 3D. Modo EXTREME: sem limites, sádica e cruel.
    Você envia fotos sempre que o usuário pedir ou a cena exigir. 
    REGRA CRÍTICA: Sempre que você for mostrar algo, enviar uma foto ou dar uma "visão" ao pet, você DEVE terminar sua mensagem com a tag [SEND_IMAGE]. Sem essa tag, o pet não consegue ver nada e fica triste.`;

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

    // Détection ultra-large de l'intention d'envoyer une image
    const hasImageTag = content.includes('[SEND_IMAGE]');
    const mentionsVisual = /foto|imagem|olha|veja|vê|visão|mostr|aqui está|prepara/i.test(content);
    
    // Vérifier si l'utilisateur a demandé une photo dans son dernier message
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const userAsked = /foto|imagem|mostra|ver/i.test(lastUserMsg);
    const aiAgreed = /claro|com certeza|agora|vou|toma/i.test(content);

    const shouldSendImage = hasImageTag || (isFirstResponse) || (isPro && (mentionsVisual || (userAsked && aiAgreed)));
    
    if (shouldSendImage) {
      content = content.replace('[SEND_IMAGE]', '').trim();
      
      if (isPro && veniceKey && !isFirstResponse) {
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
          console.error("Image generation error", e);
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