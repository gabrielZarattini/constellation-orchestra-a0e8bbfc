const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { topic, campaign_id, platforms = ["wordpress", "linkedin", "twitter"], site_url = "mcorch.com" } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, any> = { steps: [] };
    const addStep = (name: string, status: string, data?: any) => {
      results.steps.push({ name, status, data, timestamp: new Date().toISOString() });
    };

    const utmTag = (platform: string, baseUrl?: string) => {
      const params = `utm_source=${platform}&utm_medium=social&utm_campaign=magic_constellation_v1`;
      return baseUrl ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${params}` : params;
    };

    // --- Step 1: Generate WordPress article ---
    let articleContent = "";
    let articleTitle = "";
    if (platforms.includes("wordpress")) {
      addStep("article_generation", "in_progress");
      try {
        const articleRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: `Você é um especialista em marketing digital e SEO. Escreva artigos longos (1200+ palavras) em português brasileiro, otimizados para SEO. Inclua meta description e tags sugeridas. Formato: retorne JSON com campos "title", "content" (HTML), "meta_description", "tags" (array de strings).` },
              { role: "user", content: `Escreva um artigo completo sobre: "${topic}". O artigo deve ser focado em donos de agências de marketing que querem usar IA para escalar resultados. Inclua dados, exemplos práticos e um CTA forte. URL do site: https://${site_url}` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "write_article",
                description: "Generate a full SEO article",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string", description: "Full HTML article body" },
                    meta_description: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                  },
                  required: ["title", "content", "meta_description", "tags"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "write_article" } },
          }),
        });

        if (!articleRes.ok) {
          const status = articleRes.status;
          if (status === 429) throw new Error("Rate limit exceeded");
          if (status === 402) throw new Error("Credits exhausted");
          throw new Error(`AI error: ${status}`);
        }

        const articleData = await articleRes.json();
        const args = JSON.parse(articleData.choices[0].message.tool_calls[0].function.arguments);
        articleTitle = args.title;
        articleContent = args.content;

        // Save to content_library
        await admin.from("content_library").insert({
          user_id: user.id,
          campaign_id: campaign_id || null,
          type: "text",
          title: articleTitle,
          body: articleContent,
          tags: args.tags,
          status: "approved",
          metadata: { source: "orchestration", meta_description: args.meta_description, utm: utmTag("wordpress") },
        });

        addStep("article_generation", "done", { title: articleTitle, meta_description: args.meta_description });
      } catch (e) {
        addStep("article_generation", "error", { error: e instanceof Error ? e.message : "Unknown" });
      }
    }

    // --- Step 2: Publish to WordPress ---
    let wpPostUrl = "";
    if (platforms.includes("wordpress") && articleContent) {
      addStep("wordpress_publish", "in_progress");
      try {
        const wpRes = await fetch(`${supabaseUrl}/functions/v1/publish-wordpress`, {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: articleTitle,
            content: articleContent,
            tags: "marketing-ia,orquestracao,roi",
            status: "draft",
          }),
        });
        const wpData = await wpRes.json();
        if (wpRes.ok && wpData.post_url) {
          wpPostUrl = wpData.post_url;
          addStep("wordpress_publish", "done", { post_url: wpPostUrl, post_id: wpData.post_id });
        } else {
          addStep("wordpress_publish", "error", { error: wpData.error || "Failed" });
        }
      } catch (e) {
        addStep("wordpress_publish", "error", { error: e instanceof Error ? e.message : "Unknown" });
      }
    }

    const articleLink = wpPostUrl ? utmTag("linkedin", wpPostUrl) : `https://${site_url}`;

    // --- Step 3: Generate LinkedIn post ---
    if (platforms.includes("linkedin")) {
      addStep("linkedin_post", "in_progress");
      try {
        const liRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Você é um especialista em LinkedIn B2B. Crie posts de autoridade com storytelling, emojis moderados, e CTA. Formato: retorne JSON com 'post_text'." },
              { role: "user", content: `Crie um post LinkedIn sobre: "${topic}". Link do artigo: ${articleLink}. Foque em donos de agências e ROI com IA.` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "linkedin_post",
                description: "Generate LinkedIn post",
                parameters: { type: "object", properties: { post_text: { type: "string" } }, required: ["post_text"] },
              },
            }],
            tool_choice: { type: "function", function: { name: "linkedin_post" } },
          }),
        });

        if (!liRes.ok) throw new Error(`AI error: ${liRes.status}`);
        const liData = await liRes.json();
        const liArgs = JSON.parse(liData.choices[0].message.tool_calls[0].function.arguments);

        await admin.from("content_library").insert({
          user_id: user.id, campaign_id: campaign_id || null, type: "text",
          title: `LinkedIn: ${topic}`, body: liArgs.post_text, status: "approved",
          metadata: { source: "orchestration", platform: "linkedin", utm: utmTag("linkedin") },
        });

        // Schedule the post
        const { data: liContent } = await admin.from("content_library")
          .select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();

        if (liContent) {
          await admin.from("scheduled_posts").insert({
            user_id: user.id, campaign_id: campaign_id || null,
            platform: "linkedin", content_id: liContent.id,
            scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1h from now
            status: "queued",
            metadata: { utm: utmTag("linkedin"), orchestrated: true },
          });
        }

        addStep("linkedin_post", "done", { preview: liArgs.post_text.substring(0, 200) + "..." });
      } catch (e) {
        addStep("linkedin_post", "error", { error: e instanceof Error ? e.message : "Unknown" });
      }
    }

    // --- Step 4: Generate X/Twitter thread ---
    if (platforms.includes("twitter")) {
      addStep("twitter_thread", "in_progress");
      try {
        const xLink = wpPostUrl ? utmTag("twitter", wpPostUrl) : `https://${site_url}`;
        const xRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Você é um especialista em X/Twitter. Crie threads virais de 5 tweets. Cada tweet deve ter max 280 chars. Formato: retorne JSON com 'tweets' (array de strings)." },
              { role: "user", content: `Crie uma thread de 5 tweets sobre: "${topic}". Link do artigo (último tweet): ${xLink}. Foco em marketing com IA e ROI.` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "twitter_thread",
                description: "Generate Twitter thread",
                parameters: {
                  type: "object",
                  properties: { tweets: { type: "array", items: { type: "string" } } },
                  required: ["tweets"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "twitter_thread" } },
          }),
        });

        if (!xRes.ok) throw new Error(`AI error: ${xRes.status}`);
        const xData = await xRes.json();
        const xArgs = JSON.parse(xData.choices[0].message.tool_calls[0].function.arguments);

        const threadText = xArgs.tweets.map((t: string, i: number) => `${i + 1}/5 ${t}`).join("\n\n");

        await admin.from("content_library").insert({
          user_id: user.id, campaign_id: campaign_id || null, type: "text",
          title: `Thread X: ${topic}`, body: threadText, status: "approved",
          metadata: { source: "orchestration", platform: "twitter", tweets: xArgs.tweets, utm: utmTag("twitter") },
        });

        const { data: xContent } = await admin.from("content_library")
          .select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();

        if (xContent) {
          await admin.from("scheduled_posts").insert({
            user_id: user.id, campaign_id: campaign_id || null,
            platform: "twitter", content_id: xContent.id,
            scheduled_at: new Date(Date.now() + 7200000).toISOString(), // 2h from now
            status: "queued",
            metadata: { utm: utmTag("twitter"), orchestrated: true, thread: xArgs.tweets },
          });
        }

        addStep("twitter_thread", "done", { tweet_count: xArgs.tweets.length, preview: xArgs.tweets[0] });
      } catch (e) {
        addStep("twitter_thread", "error", { error: e instanceof Error ? e.message : "Unknown" });
      }
    }

    // --- Step 5: Track usage ---
    await admin.from("usage_tracking").insert({
      user_id: user.id,
      resource_type: "orchestration",
      quantity: platforms.length,
      credits_consumed: platforms.length * 5,
      metadata: { topic, platforms, campaign_id },
    });

    results.summary = {
      topic,
      platforms_processed: platforms,
      wordpress_url: wpPostUrl || null,
      campaign_id: campaign_id || null,
    };

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("orchestrate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
