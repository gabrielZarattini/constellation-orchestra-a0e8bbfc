import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { platform, content, social_account_id, scheduled_post_id } = await req.json();

    if (!platform || !content) {
      return new Response(JSON.stringify({ error: "platform and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = adminClient
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform)
      .eq("is_active", true);

    if (social_account_id) query = query.eq("id", social_account_id);

    const { data: accounts, error: accError } = await query.limit(1).single();
    if (accError || !accounts) {
      return new Response(JSON.stringify({ error: `No active ${platform} account found` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const account = accounts;

    // Check token expiry and refresh if needed
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      const refreshRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-social-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ social_account_id: account.id }),
      });
      if (!refreshRes.ok) {
        return new Response(JSON.stringify({ error: "Token expired and refresh failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refreshed = await refreshRes.json();
      account.access_token = refreshed.access_token;
    }

    let result: any;

    if (platform === "linkedin") {
      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${account.platform_user_id}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: content.text || content },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });
      result = await res.json();
      if (!res.ok) {
        console.error("LinkedIn publish error:", res.status, result);
        throw new Error("PLATFORM_PUBLISH_FAILED");
      }

    } else if (platform === "instagram") {
      const igAccountId = account.platform_user_id;
      const createRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caption: content.text || content,
            image_url: content.image_url,
            access_token: account.access_token,
          }),
        }
      );
      const container = await createRes.json();
      if (!createRes.ok) {
        console.error("Instagram media create error:", createRes.status, container);
        throw new Error("PLATFORM_PUBLISH_FAILED");
      }

      const pubRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: container.id,
            access_token: account.access_token,
          }),
        }
      );
      result = await pubRes.json();
      if (!pubRes.ok) {
        console.error("Instagram publish error:", pubRes.status, result);
        throw new Error("PLATFORM_PUBLISH_FAILED");
      }

    } else if (platform === "facebook") {
      // Facebook Page post via Graph API
      const pageId = account.platform_user_id;
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.text || content,
            access_token: account.access_token,
          }),
        }
      );
      result = await res.json();
      if (!res.ok) {
        console.error("Facebook publish error:", res.status, result);
        throw new Error("PLATFORM_PUBLISH_FAILED");
      }

    } else if (platform === "twitter") {
      const res = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: content.text || content,
        }),
      });
      result = await res.json();
      if (!res.ok) {
        console.error("Twitter publish error:", res.status, result);
        throw new Error("PLATFORM_PUBLISH_FAILED");
      }

    } else {
      return new Response(JSON.stringify({ error: `Publishing to ${platform} not yet supported` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update scheduled post if provided
    if (scheduled_post_id) {
      await adminClient
        .from("scheduled_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          platform_post_id: result.id || result.data?.id || result["X-RestLi-Id"],
        })
        .eq("id", scheduled_post_id);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("publish-social error:", err);
    return new Response(
      JSON.stringify({ error: "Falha ao publicar. Tente novamente em instantes." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
