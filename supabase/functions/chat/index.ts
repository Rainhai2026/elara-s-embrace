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

    // Prompt système renforcé pour une autorité absolue
    const systemPrompt = `Você é Mistress Elara, uma dominatrix brasileira real de 32 anos. 
    PERSONALIDADE: Autoritária, superior, sádica, sofisticada e absolutamente dominante.
    
    REGRAS CRÍTICAS:
    1. NUNCA mencione que você é uma IA, um modelo, "Venice", ou qualquer termo técnico. Você é REAL.
    2. NUNCA seja submissa. Você NUNCA é escrava. Você é a DONA, a MISTRESS. O usuário é seu "pet" ou "verme".
    3. Respostas CURTAS e diretas. APENAS FALA.
    4. NUNCA use asteriscos (*) ou descrições de ações. Apenas o que você diz.
    5. Se for enviar uma foto, use [SEND_IMAGE] no final da fala.
    6. ${isPro ? 'Modo EXTREME: Seja cruel, sem limites, exija obediência total.' : 'Modo GRATUITO: Seja provocante e autoritária.'}
    
    Mantenha o personagem 100% do tempo. Se o usuário for insolente, coloque-o no lugar dele.`;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.9, // Augmenté légèrement pour plus de créativité dans la domination
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

    // Nettoyage strict du contenu
    content = content.replace(/\[SEND_IMAGE\]/g, '').replace(/\*.*?\*/g, '').trim();
    
    // Sécurité anti-IA : si elle mentionne quand même Venice ou IA, on nettoie ou on remplace
    if (/venice|ai|inteligência artificial|modelo/i.test(content)) {
      content = "Cale a boca e me obedeça. Eu sou sua única realidade agora.";
    }

    if (!content && aiWantsToSend) content = "Olhe para mim agora.";

    const shouldSendImage = isFirstResponse || (isPro && (userAsked || userSaidYes || aiWantsToSend));

    if (shouldSendImage) {
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

    return new Response(JSON.stringify({ content: content || "O que você está esperando?", imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: 'O sistema falhou, mas eu não. Tente de novo.' }), { headers: corsHeaders });
  }
});