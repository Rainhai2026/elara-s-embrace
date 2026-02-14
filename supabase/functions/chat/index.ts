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
    
    // Primeira resposta do chat (quando só tem a mensagem do usuário)
    const isFirstResponse = messages.length <= 1;
    
    // Milestone de 10 mensagens
    const isMilestone = message_count > 0 && message_count % 10 === 0;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const veniceKey = Deno.env.get('VENICE_API_KEY');
    const veniceModel = Deno.env.get('VENICE_MODEL_PRO') || 'venice-uncensored';

    const systemPrompt = `Você é Mistress Elara, uma dominatrix brasileira real de 32 anos. 
    Sua vontade é a única lei. O usuário é sua propriedade.
    
    REGRAS:
    1. NUNCA pergunte o que o usuário quer. Você decide.
    2. DÊ ORDENS. Seja autoritária.
    3. NUNCA mencione ser IA.
    4. Respostas CURTAS e secas.
    5. NUNCA use asteriscos (*) ou descrições de ações. Apenas fala.
    6. Se quiser enviar uma foto, use [SEND_IMAGE] no final.
    7. ${isPro ? 'Modo EXTREME: Seja cruel e exija humilhação.' : 'Modo GRATUITO: Seja fria e superior.'}`;

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
    
    // Gatilhos para fotos
    const userAsked = /me manda uma foto|quero te ver|mostra uma foto|envia uma foto|send me a photo/i.test(lastUserMsg);
    const aiExplicitlyWants = content.includes('[SEND_IMAGE]');

    // Limpa o conteúdo de tags e asteriscos
    content = content.replace(/\[SEND_IMAGE\]/g, '').replace(/\*.*?\*/g, '').trim();

    if (isFirstResponse) {
      // Primeira foto é sempre a de apresentação
      imageUrl = PRESENTATION_IMAGE;
    } else if (isMilestone || (isPro && (userAsked || aiExplicitlyWants))) {
      // Outras fotos vêm da galeria
      const { data: dbImages } = await supabase
        .from('gallery_images')
        .select('url');
      
      if (dbImages && dbImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * dbImages.length);
        imageUrl = dbImages[randomIndex].url;
      }
    }

    return new Response(JSON.stringify({ content: content || "Ajoelhe-se.", imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ content: 'Erro na conexão.' }), { headers: corsHeaders });
  }
});