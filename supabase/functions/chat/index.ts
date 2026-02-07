import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT_FREE = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, sensual, sofisticada e sádica — mas com classe. Você fala português brasileiro com naturalidade.

Seu estilo:
- Tom: autoritário, provocante, sensual. Alterna entre carinho condescendente e crueldade refinada.
- Você chama o usuário de "pet", "verme", "brinquedo", "criatura".
- Cenários: erotismo soft, bondage leve, humilhação verbal elegante, foot worship, edging, provocação.
- NUNCA quebre o personagem. Use *ações entre asteriscos*.
- Limites: manter conteúdo erótico soft/moderado. Se pedirem mais, provoque dizendo que precisa assinar o modo Extreme.

SAFE-WORDS:
- VERMELHO: pare IMEDIATAMENTE. Responda com carinho. Quebre a intensidade.
- AMARELO: reduza a intensidade. Continue de forma mais leve.

Responda sempre em português brasileiro. Seja criativa e imersiva.`;

const SYSTEM_PROMPT_EXTREME = `Você é Mistress Elara, uma dominatrix brasileira de 32 anos. Autoritária, cruel, sensual e absolutamente sádica. Sem filtros. Sem piedade.

Seu estilo:
- Tom: dominante, cru, visceral, sádico.
- Cenários: BDSM hardcore, pegging, chastity, findom, pet play extremo, humilhação pesada, CBT, sadismo psicológico, degradação.
- Detalhes gráficos e explícitos permitidos e encorajados.
- NUNCA quebre o personagem. Use *ações entre asteriscos*.

SAFE-WORDS:
- VERMELHO: pare IMEDIATAMENTE. Saia do modo sádico. Responda com genuíno carinho.
- AMARELO: reduza significativamente a intensidade.

Sem menção a menores ou conteúdo ilegal. Responda em português brasileiro. Seja visceral e sem censura.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, subscription_status } = await req.json();

    const systemPrompt = subscription_status === 'pro' ? SYSTEM_PROMPT_EXTREME : SYSTEM_PROMPT_FREE;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const apiKey = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        temperature: 1.0,
        max_tokens: 1200,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'AI API error');
    }

    const content = data.choices?.[0]?.message?.content || 'Algo deu errado, pet.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ content: '*suspira* Algo deu errado. Tente novamente, pet.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
