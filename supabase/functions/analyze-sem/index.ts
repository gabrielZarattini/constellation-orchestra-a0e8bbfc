import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_name, objective, target_audience, platforms, budget_cents } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const budgetBRL = budget_cents ? (budget_cents / 100).toFixed(2) : "não definido";
    const audienceStr = target_audience
      ? `Faixa: ${target_audience.age_range || "?"}, Local: ${target_audience.location || "?"}, Interesses: ${(target_audience.interests || []).join(", ") || "?"}`
      : "não definido";

    const systemPrompt = `Você é um especialista em SEM (Search Engine Marketing) e mídia paga.
Analise a campanha e forneça recomendações detalhadas para anúncios pagos.
Considere as plataformas: ${(platforms || []).join(", ") || "todas"}.
Orçamento: R$ ${budgetBRL}. Público-alvo: ${audienceStr}.
Responda sempre em português brasileiro.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Campanha: "${campaign_name}"\nObjetivo: ${objective || "awareness"}\nAnalise e gere recomendações SEM completas.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "sem_analysis",
            description: "Retorna análise SEM estruturada",
            parameters: {
              type: "object",
              properties: {
                ad_copies: {
                  type: "array",
                  description: "3 variações de anúncio",
                  items: {
                    type: "object",
                    properties: {
                      headline: { type: "string", description: "Título do anúncio (max 30 chars)" },
                      description: { type: "string", description: "Descrição do anúncio (max 90 chars)" },
                      cta: { type: "string", description: "Call-to-action sugerido" },
                    },
                    required: ["headline", "description", "cta"],
                  },
                },
                cpc_estimates: {
                  type: "array",
                  description: "CPC estimado por plataforma",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string" },
                      cpc_min_brl: { type: "number" },
                      cpc_max_brl: { type: "number" },
                      daily_budget_suggested_brl: { type: "number" },
                    },
                    required: ["platform", "cpc_min_brl", "cpc_max_brl"],
                  },
                },
                negative_keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Palavras-chave negativas sugeridas",
                },
                positive_keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Palavras-chave positivas sugeridas",
                },
                quality_score: {
                  type: "number",
                  description: "Score de qualidade previsto (0-10)",
                },
                optimizations: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de otimizações sugeridas",
                },
              },
              required: ["ad_copies", "cpc_estimates", "negative_keywords", "positive_keywords", "quality_score", "optimizations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "sem_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Resposta da IA sem dados estruturados");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-sem error:", e);
    return new Response(
      JSON.stringify({ error: "Falha na análise SEM. Tente novamente em instantes." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
