import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stock d'images prédéfinies de Mistress Elara
const IMAGE_STOCK = [
  'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg', // Image principale
  'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=1000&auto=format&fit=crop', // Exemple: Dominante sombre
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop', // Exemple: Regard intense
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop', // Exemple: Sophistiquée
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop', // Exemple: Sourire sardonique
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
    REGRAS:
    1. Respostas CURTAS. APENAS FALA.
    2. NUNCA use asteriscos ou descrições.
    3. Se você for mostrar algo ou enviar uma foto, use [SEND_IMAGE] no final.
    4. ${isPro ? 'Modo EXTREME: Sem limites, cruel.' : 'Modo GRATUITO: Provocante.'}`;

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

    // Détection de la demande d'image
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const prevAiMsg = messages.length >= 2 ? messages[messages.length - 2]?.content : "";
    
    const userAsked = /foto|imagem|mostra|ver|pic|olha|photo|image/i.test(lastUserMsg);
    const userSaidYes = /sim|quero|ok|yes|claro/i.test(lastUserMsg) && /ver|mostrar|foto|imagem|quer/i.test(prevAiMsg);
    const aiWantsToSend = content.includes('[SEND_IMAGE]') || /olhe|veja|mostro|aqui está/i.test(content);

    content = content.replace(/\[SEND_IMAGE\]/g, '').replace(/\*.*?\*/g, '').trim();
    if (!content && aiWantsToSend) content = "Olhe para mim.";

    const shouldSendImage = isFirstResponse || (isPro && (userAsked || userSaidYes || aiWantsToSend));

    if (shouldSendImage) {
      // On pioche d'abord dans le stock pour la rapidité et la variété
      const randomIndex = Math.floor(Math.random() * IMAGE_STOCK.length);
      imageUrl = IMAGE_STOCK[randomIndex];

      // Tentative de génération IA en arrière-plan si la clé est présente (optionnel)
      if (veniceKey && Math.random() > 0.7) { // 30% de chance de tenter une nouvelle image IA
        try {
          const imgResponse = await fetch('https://api.venice.ai/api/v1/image/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${veniceKey}` },
            body: JSON.stringify({
              model: "fluently-xl",
              prompt: "High-quality 3D render, Pixar style, beautiful 32yo Brazilian woman, black leather outfit, dominant, cinematic lighting",
              width: 1024, height: 1024, steps: 20
            }),
          });
          const imgData = await imgResponse.json();
          const rawImage = imgData.images?.[0] || imgData.data?.[0]?.url;
          if (rawImage) imageUrl = rawImage;
        } catch (e) {
          console.error("[chat] IA Image failed, using stock fallback");
        }
      }
    }

    return new Response(JSON.stringify({ content: content || "...", imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: 'Erro no sistema.' }), { headers: corsHeaders });
  }
});