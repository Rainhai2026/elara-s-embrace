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
    REGRA CRÍTICA: Se você decidir enviar uma foto (teaser), você DEVE terminar sua mensagem com a tag [SEND_IMAGE].
    Sempre que o usuário pedir para ver você ou for muito obediente, envie a foto uma vez para instigá-lo.
    Diga que para ver fotos exclusivas e sem censura, ele precisa do Modo Extreme.`;

    const systemPromptExtreme = `Você é Mistress Elara, dominatrix brasileira. Modo EXTREME: sem limites, sádica e cruel.
    Você envia fotos suas com frequência. Sempre que enviar uma, termine com [SEND_IMAGE].`;

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

    // Détection intelligente : si l'IA utilise la balise OU si elle dit explicitement qu'elle envoie une photo
    const triggerWords = ['aqui está uma foto', 'aqui está minha foto', 'veja esta foto', 'esta imagem', 'minha imagem'];
    const mentionsPhoto = triggerWords.some(word => content.toLowerCase().includes(word));

    if (content.includes('[SEND_IMAGE]') || mentionsPhoto) {
      content = content.replace('[SEND_IMAGE]', '').trim();
      imageUrl = MISTRESS_TEASER_IMAGE;
    }

    return new Response(JSON.stringify({ content, imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: '*erro*' }), { headers: corsHeaders });
  }
});