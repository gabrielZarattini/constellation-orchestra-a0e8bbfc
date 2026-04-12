import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, format, duration } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatGuide: Record<string, string> = {
      podcast: "Crie um roteiro completo de podcast com introdução, desenvolvimento, pontos de discussão e conclusão. Inclua marcações [INTRO], [TRANSIÇÃO], [PONTO], [CONCLUSÃO].",
      narração: "Crie um roteiro de narração profissional para vídeo ou audiobook. Inclua marcações de tom [CALMO], [ENFÁTICO], [PAUSAR].",
      jingle: "Crie letra e estrutura de um jingle/música curta publicitária. Inclua [VERSO], [REFRÃO], [BRIDGE]. Sugira BPM e estilo musical.",
      música: "Crie letra completa de uma música com estrutura profissional. Inclua [INTRO], [VERSO 1], [PRÉ-REFRÃO], [REFRÃO], [VERSO 2], [PONTE], [OUTRO]. Sugira gênero, BPM e instrumentação.",
    };

    const durationGuide: Record<string, string> = {
      curto: "Mantenha o conteúdo breve (30 segundos a 1 minuto de áudio).",
      médio: "Crie conteúdo de duração média (2 a 5 minutos de áudio).",
      longo: "Crie conteúdo longo e detalhado (5 a 15 minutos de áudio).",
    };

    const systemPrompt = `Você é um roteirista profissional brasileiro especializado em produção de áudio e música para marketing.
${formatGuide[format] || formatGuide.podcast}
${durationGuide[duration] || durationGuide.médio}
Responda sempre em português brasileiro. Seja criativo e profissional.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-audio-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
