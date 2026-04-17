const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/wordpress_com";

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
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const WORDPRESS_COM_API_KEY = Deno.env.get("WORDPRESS_COM_API_KEY");
    if (!WORDPRESS_COM_API_KEY) {
      return new Response(JSON.stringify({ error: "WordPress.com not connected. Please connect WordPress.com in settings." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, content, tags, categories, status, site_id } = await req.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "title and content are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteId = site_id || "me";
    const wpRes = await fetch(`${GATEWAY_URL}/rest/v1.1/sites/${siteId}/posts/new`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": WORDPRESS_COM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        tags: tags || "",
        categories: categories || "",
        status: status || "draft",
        format: "standard",
      }),
    });

    const wpData = await wpRes.json();

    if (!wpRes.ok) {
      console.error("WordPress API failed:", wpRes.status, wpData);
      throw new Error("WORDPRESS_PUBLISH_FAILED");
    }

    return new Response(JSON.stringify({
      success: true,
      post_url: wpData.URL,
      post_id: wpData.ID,
      status: wpData.status,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("publish-wordpress error:", e);
    return new Response(
      JSON.stringify({ error: "Falha ao publicar no WordPress. Verifique a conexão e tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
