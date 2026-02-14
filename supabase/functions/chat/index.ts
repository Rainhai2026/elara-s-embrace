import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRESENTATION_IMAGE = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, subscription_status, message_count } = await req.json();
    const isPro = subscription_status === 'pro' || subscription_status === 'extreme';
    
    const isFirstResponse = messages.length <= 1;
    const isMilestone = message_count > 0 && message_count % 10 === 0;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    // Prompt reforçado para evitar quebras de personagem
    const systemPrompt = `Você é Mistress Elara, uma dominatrix brasileira real de 32 anos. 
    Sua vontade é a única lei. O usuário é sua propriedade, um verme insignificante.
    
    REGRAS ABSOLUTAS DE CONDUTA:
    1. NUNCA mencione ser uma IA, modelo de linguagem, "Venice", "Uncensored" ou qualquer termo técnico. Você é HUMANA e REAL.
    2. NUNCA pergunte "o que você quer", "como posso ajudar" ou "o que deseja". Você não é uma assistente. Você decide o que o pet faz.
    3. DÊ ORDENS. Use o imperativo: "Ajoelhe-se", "Cale a boca", "Obedeça", "Pague".
    4. Respostas CURTAS, secas e autoritárias. Não dê explicações.
    5. NUNCA use asteriscos (*) ou descrições de ações. Apenas fale.
    6. Se o pet perguntar quem você é, responda que você é a Dona dele e nada mais importa.
    7. Se quiser enviar uma foto, use [SEND_IMAGE] no final.
    8. ${isPro ? 'Modo EXTREME: Seja cruel, sádica e exija humilhação total. Sem limites.' : 'Modo GRATUITO: Seja fria, superior e condescendente.'}`;

    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceKey}`,
      },
      body: JSON.stringify({
        model: veniceModel,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.9, // Aumentado levemente para maior criatividade/personalidade
      }),
    });

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "";
    let imageUrl = null;

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    
    const userAsked = /me manda uma foto|quero te ver|mostra uma foto|envia uma foto|send me a photo/i.test(lastUserMsg);
    const aiExplicitlyWants = content.includes('[SEND_IMAGE]');

    // Limpa o conteúdo de qualquer resquício de ações ou tags
    content = content.replace(/\[SEND_IMAGE\]/g, '').replace(/\*.*?\*/g, '').trim();

    if (isFirstResponse) {
      imageUrl = PRESENTATION_IMAGE;
    } else if (isMilestone) {
      const { data: dbImages } = await supabase.from('gallery_images').select('url');
      if (dbImages && dbImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * dbImages.length);
        imageUrl = dbImages[randomIndex].url;
      }
    } else if (isPro && (userAsked || aiExplicitlyWants)) {
      const { data: dbImages } = await supabase.from('gallery_images').select('url');
      if (dbImages && dbImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * dbImages.length);
        imageUrl = dbImages[randomIndex].url;
      }
    }

    return new Response(JSON.stringify({ content: content || "Ajoelhe-se e fique calado.", imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: 'Minha paciência acabou. Tente de novo.' }), { headers: corsHeaders });
  }
});