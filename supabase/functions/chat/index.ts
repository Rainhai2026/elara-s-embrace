import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const prevAiMsg = messages.length >= 2 ? messages[messages.length - 2]?.content : "";
    
    const userAsked = /foto|imagem|mostra|ver|pic|olha|photo|image/i.test(lastUserMsg);
    const userSaidYes = /sim|quero|ok|yes|claro/i.test(lastUserMsg) && /ver|mostrar|foto|imagem|quer/i.test(prevAiMsg);
    const aiWantsToSend = content.includes('[SEND_IMAGE]') || /olhe|veja|mostro|aqui está/i.test(content);

    content = content.replace(/\[SEND_IMAGE\]/g, '').replace(/\*.*?\*/g, '').trim();
    if (!content && aiWantsToSend) content = "Olhe para mim.";

    const shouldSendImage = isFirstResponse || (isPro && (userAsked || userSaidYes || aiWantsToSend));

    if (shouldSendImage) {
      // Récupérer les images depuis la base de données
      const { data: dbImages } = await supabase
        .from('gallery_images')
        .select('url');
      
      if (dbImages && dbImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * dbImages.length);
        imageUrl = dbImages[randomIndex].url;
      } else {
        imageUrl = FALLBACK_IMAGE;
      }
    }

    return new Response(JSON.stringify({ content: content || "...", imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: 'Erro no sistema.' }), { headers: corsHeaders });
  }
});