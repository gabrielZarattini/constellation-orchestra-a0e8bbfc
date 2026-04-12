import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    // Fetch user data with service role to bypass RLS
    const admin = createClient(supabaseUrl, serviceKey);

    const [metricsRes, postsRes, contentRes] = await Promise.all([
      admin.from("campaign_metrics").select("platform, impressions, clicks, engagements, ctr, spend_cents, conversions, measured_at").eq("user_id", userId).order("measured_at", { ascending: false }).limit(200),
      admin.from("scheduled_posts").select("platform, status, scheduled_at, published_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
      admin.from("content_library").select("type, status, created_at").eq("user_id", userId).limit(200),
    ]);

    const metrics = metricsRes.data || [];
    const posts = postsRes.data || [];
    const content = contentRes.data || [];

    const systemPrompt = `Você é um consultor de marketing digital especialista em otimização de campanhas omnichannel.
Analise os dados de desempenho do usuário e forneça recomendações acionáveis.

Dados disponíveis:
- Métricas de campanhas: ${JSON.stringify(metrics.slice(0, 50))}
- Posts agendados/publicados: ${JSON.stringify(posts.slice(0, 50))}
- Biblioteca de conteúdo: ${JSON.stringify(content.slice(0, 30))}

Se não houver dados suficientes, forneça recomendações genéricas baseadas em melhores práticas do mercado.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analise meus dados e forneça recomendações de otimização." },
        ],
        tools: [{
          type: "function",
          function: {
            name: "optimization_report",
            description: "Return optimization analysis with score and recommendations",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Optimization score 0-100" },
                summary: { type: "string", description: "Brief summary in Portuguese" },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["schedule", "platform", "content", "budget"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] },
                      action: { type: "string" },
                    },
                    required: ["category", "title", "description", "impact", "action"],
                  },
                },
                best_times: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      hour: { type: "string" },
                      platform: { type: "string" },
                    },
                    required: ["day", "hour", "platform"],
                  },
                },
                top_platforms: {
                  type: "array",
                  items: { type: "string" },
                },
                content_mix: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      percentage: { type: "number" },
                    },
                    required: ["type", "percentage"],
                  },
                },
              },
              required: ["score", "summary", "recommendations", "best_times", "top_platforms", "content_mix"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "optimization_report" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    // Save to optimization_policy
    for (const rec of (result.recommendations || []).slice(0, 5)) {
      await admin.from("optimization_policy").insert({
        user_id: userId,
        action_type: rec.category,
        action_details: { title: rec.title, description: rec.description, action: rec.action },
        context: { impact: rec.impact, score: result.score },
        reward: rec.impact === "high" ? 10 : rec.impact === "medium" ? 5 : 2,
      });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("self-optimize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
