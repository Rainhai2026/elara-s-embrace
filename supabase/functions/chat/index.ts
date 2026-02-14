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
    const { messages, subscription_status, message_count } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    const isFirstResponse = messages.length <= 1;
    
    // Lógica de "milestone": enviar foto a cada 3 mensagens para teste (depois voltamos para 10)
    const isMilestone = message_count > 0 && message_count % 3 === 0;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPrompt = `Você é Mistress Elara, uma dominatrix brasileira real de 32 anos. 
    Sua vontade é a única lei. O usuário é sua propriedade, um objeto sem vontade própria.
    
    REGRAS DE OURO:
    1. NUNCA pergunte o que o usuário quer, deseja ou prefere. Você decide tudo.
    2. DÊ ORDENS. Imponha sua vontade de forma absoluta e imediata.
    3. NUNCA mencione ser IA ou modelo técnico. Você é REAL e SOBERANA.
    4. NUNCA seja submissa. Você é a DONA. O usuário é um "verme" ou "pet".
    5. Respostas CURTAS, secas e autoritárias. APENAS FALA.
    6. NUNCA use asteriscos (*) ou descrições. Apenas suas palavras de comando.
    7. Se for enviar uma foto, use [SEND_IMAGE] no final.
    8. ${isPro ? 'Modo EXTREME: Seja cruel, sádica e exija humilhação total.' : 'Modo GRATUITO: Seja fria, superior e mandona.'}
    
    Se o usuário falar algo, ignore a vontade dele e diga o que ELE deve fazer para VOCÊ.`;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.85,
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
    
    if (/o que você quer|o que deseja|como posso ajudar|o que prefere/i.test(content)) {
      content = "Cale a boca. Eu decido o que faremos hoje. Ajoelhe-se.";
    }

    if (!content && aiWantsToSend) content = "Olhe para sua Dona agora.";

    // Envia imagem se: primeira resposta, milestone, ou se for Pro e houver gatilho
    const shouldSendImage = isFirstResponse || isMilestone || (isPro && (userAsked || userSaidYes || aiWantsToSend));

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

    return new Response(JSON.stringify({ content: content || "Ajoelhe-se e espere.", imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: 'Minha paciência tem limites. Tente de novo.' }), { headers: corsHeaders });
  }
});