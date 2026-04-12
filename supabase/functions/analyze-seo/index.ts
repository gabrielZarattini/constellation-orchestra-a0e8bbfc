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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Autenticação necessária");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Usuário não autenticado");

    const { text, platform } = await req.json();
    if (!text) throw new Error("Texto é obrigatório");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI key não configurada");

    const systemPrompt = `Você é um especialista em SEO e marketing digital. Analise o conteúdo fornecido e retorne uma análise SEO completa.
${platform ? `Plataforma alvo: ${platform}` : ""}
Considere: palavras-chave, legibilidade, estrutura, meta description, densidade de keywords, e dê sugestões de melhoria.`;

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
          { role: "user", content: `Analise o seguinte conteúdo para SEO:\n\n${text}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "seo_analysis",
              description: "Retorna análise SEO estruturada do conteúdo",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Score SEO de 0 a 100" },
                  readability_score: { type: "number", description: "Score de legibilidade de 0 a 100" },
                  keyword_density: { type: "number", description: "Densidade de palavras-chave em porcentagem" },
                  meta_description: { type: "string", description: "Meta description otimizada sugerida (máx 160 chars)" },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de palavras-chave principais sugeridas",
                  },
                  improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["estrutura", "keywords", "legibilidade", "meta", "conteúdo"] },
                        suggestion: { type: "string" },
                        priority: { type: "string", enum: ["alta", "média", "baixa"] },
                      },
                      required: ["category", "suggestion", "priority"],
                    },
                    description: "Lista de melhorias sugeridas",
                  },
                  optimized_text: { type: "string", description: "Versão otimizada do texto com melhorias aplicadas" },
                },
                required: ["score", "readability_score", "keyword_density", "meta_description", "keywords", "improvements", "optimized_text"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "seo_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
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
    if (!toolCall) throw new Error("Resposta inválida da IA");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-seo error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
