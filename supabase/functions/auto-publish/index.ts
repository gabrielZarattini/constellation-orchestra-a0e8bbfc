import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all queued posts where scheduled_at <= now
    const { data: duePosts, error } = await adminClient
      .from("scheduled_posts")
      .select("*, social_accounts(*)")
      .eq("status", "queued")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at")
      .limit(50);

    if (error) {
      console.error("Error fetching due posts:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!duePosts || duePosts.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No posts due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const post of duePosts) {
      try {
        // Mark as publishing
        await adminClient
          .from("scheduled_posts")
          .update({ status: "publishing" })
          .eq("id", post.id);

        // Get the content body if content_id exists
        let contentText = "";
        if (post.content_id) {
          const { data: content } = await adminClient
            .from("content_library")
            .select("body, title")
            .eq("id", post.content_id)
            .single();
          contentText = content?.body || content?.title || "";
        }

        if (!contentText) {
          contentText = `Post agendado para ${post.platform}`;
        }

        // Call publish-social
        const publishRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/publish-social`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              platform: post.platform,
              content: contentText,
              social_account_id: post.social_account_id,
              scheduled_post_id: post.id,
            }),
          }
        );

        if (publishRes.ok) {
          results.push({ id: post.id, status: "published" });
        } else {
          const errBody = await publishRes.json().catch(() => ({ error: "Unknown" }));
          const retryCount = (post.retry_count || 0) + 1;
          const maxRetries = post.max_retries || 3;

          await adminClient
            .from("scheduled_posts")
            .update({
              status: retryCount >= maxRetries ? "failed" : "queued",
              retry_count: retryCount,
              error_message: errBody.error || "Publish failed",
            })
            .eq("id", post.id);

          results.push({ id: post.id, status: "failed", error: errBody.error });
        }
      } catch (e) {
        const retryCount = (post.retry_count || 0) + 1;
        await adminClient
          .from("scheduled_posts")
          .update({
            status: retryCount >= (post.max_retries || 3) ? "failed" : "queued",
            retry_count: retryCount,
            error_message: e.message,
          })
          .eq("id", post.id);

        results.push({ id: post.id, status: "error", error: e.message });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("auto-publish error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
