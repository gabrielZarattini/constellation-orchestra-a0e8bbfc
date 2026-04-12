import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function healUser(admin: any, userId: string) {
  const healingResults: Array<{
    issue_type: string;
    issue_details: string;
    action_taken: string;
    success: boolean;
    related_resource_id?: string;
    related_resource_type?: string;
  }> = [];

  // 1. Failed posts retry
  const { data: failedPosts } = await admin
    .from("scheduled_posts")
    .select("id, platform, status, retry_count, max_retries, error_message, social_account_id")
    .eq("user_id", userId)
    .eq("status", "failed")
    .order("updated_at", { ascending: false })
    .limit(20);

  for (const post of failedPosts || []) {
    const retryCount = post.retry_count || 0;
    const maxRetries = post.max_retries || 3;

    if (retryCount < maxRetries) {
      await admin
        .from("scheduled_posts")
        .update({
          status: "queued",
          error_message: null,
          scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .eq("id", post.id);

      healingResults.push({
        issue_type: "failed_post",
        issue_details: `Post ${post.platform} falhou: ${post.error_message || "erro desconhecido"}`,
        action_taken: `Reagendado para retry (${retryCount + 1}/${maxRetries})`,
        success: true,
        related_resource_id: post.id,
        related_resource_type: "scheduled_post",
      });
    } else {
      healingResults.push({
        issue_type: "failed_post_max_retries",
        issue_details: `Post ${post.platform} atingiu limite de ${maxRetries} tentativas: ${post.error_message}`,
        action_taken: "Notificação enviada — requer ação manual",
        success: false,
        related_resource_id: post.id,
        related_resource_type: "scheduled_post",
      });
    }
  }

  // 2. Expired tokens
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const { data: accounts } = await admin
    .from("social_accounts")
    .select("id, platform, platform_username, token_expires_at, refresh_token, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  for (const account of accounts || []) {
    if (!account.token_expires_at) continue;
    const expiresAt = new Date(account.token_expires_at);
    const now = new Date();

    if (expiresAt < now) {
      if (account.refresh_token) {
        try {
          const refreshRes = await fetch(`${supabaseUrl}/functions/v1/refresh-social-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({ social_account_id: account.id }),
          });
          if (refreshRes.ok) {
            healingResults.push({
              issue_type: "expired_token",
              issue_details: `Token ${account.platform} (@${account.platform_username}) expirado`,
              action_taken: "Token renovado automaticamente",
              success: true,
              related_resource_id: account.id,
              related_resource_type: "social_account",
            });
          } else {
            await admin.from("social_accounts").update({ is_active: false }).eq("id", account.id);
            healingResults.push({
              issue_type: "expired_token",
              issue_details: `Token ${account.platform} (@${account.platform_username}) expirado`,
              action_taken: `Refresh falhou. Conta desativada — reconecte manualmente.`,
              success: false,
              related_resource_id: account.id,
              related_resource_type: "social_account",
            });
          }
        } catch (e) {
          healingResults.push({
            issue_type: "expired_token",
            issue_details: `Token ${account.platform} expirado`,
            action_taken: `Erro ao renovar: ${e instanceof Error ? e.message : "unknown"}`,
            success: false,
            related_resource_id: account.id,
            related_resource_type: "social_account",
          });
        }
      } else {
        await admin.from("social_accounts").update({ is_active: false }).eq("id", account.id);
        healingResults.push({
          issue_type: "expired_token_no_refresh",
          issue_details: `Token ${account.platform} (@${account.platform_username}) expirado sem refresh token`,
          action_taken: "Conta desativada — reconecte manualmente",
          success: false,
          related_resource_id: account.id,
          related_resource_type: "social_account",
        });
      }
    } else if (expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      if (account.refresh_token) {
        try {
          const refreshRes = await fetch(`${supabaseUrl}/functions/v1/refresh-social-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({ social_account_id: account.id }),
          });
          if (refreshRes.ok) {
            healingResults.push({
              issue_type: "token_expiring_soon",
              issue_details: `Token ${account.platform} (@${account.platform_username}) expira em menos de 24h`,
              action_taken: "Token renovado preventivamente",
              success: true,
              related_resource_id: account.id,
              related_resource_type: "social_account",
            });
          }
        } catch (_) { /* silent */ }
      }
    }
  }

  // 3. Stuck publishing posts
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: stuckPosts } = await admin
    .from("scheduled_posts")
    .select("id, platform, updated_at, retry_count, max_retries")
    .eq("user_id", userId)
    .eq("status", "publishing")
    .lt("updated_at", tenMinAgo)
    .limit(20);

  for (const post of stuckPosts || []) {
    const retryCount = post.retry_count || 0;
    const maxRetries = post.max_retries || 3;
    await admin
      .from("scheduled_posts")
      .update({
        status: retryCount < maxRetries ? "queued" : "failed",
        error_message: "Publicação travou — resetado automaticamente",
        retry_count: retryCount + 1,
        scheduled_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      })
      .eq("id", post.id);

    healingResults.push({
      issue_type: "stuck_publishing",
      issue_details: `Post ${post.platform} travado em "publishing" há mais de 10 min`,
      action_taken: retryCount < maxRetries ? "Resetado para fila" : "Marcado como falho",
      success: retryCount < maxRetries,
      related_resource_id: post.id,
      related_resource_type: "scheduled_post",
    });
  }

  // Save results
  for (const result of healingResults) {
    await admin.from("healing_actions").insert({ user_id: userId, ...result });
    if (!result.success) {
      await admin.from("notifications").insert({
        user_id: userId,
        title: `⚠️ Self-Healing: ${result.issue_type.replace(/_/g, " ")}`,
        message: result.action_taken,
        type: "warning",
      });
    }
  }

  return healingResults;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");

    // Check if called with service role key (cron mode) — process ALL users
    if (authHeader === `Bearer ${supabaseKey}` || authHeader === `Bearer ${serviceKey}`) {
      // Cron mode: get all users with active posts or accounts
      const { data: postUsers } = await admin
        .from("scheduled_posts")
        .select("user_id")
        .in("status", ["queued", "publishing", "failed"])
        .limit(500);

      const { data: accountUsers } = await admin
        .from("social_accounts")
        .select("user_id")
        .eq("is_active", true)
        .limit(500);

      const userIds = [...new Set([
        ...(postUsers || []).map((p: any) => p.user_id),
        ...(accountUsers || []).map((a: any) => a.user_id),
      ])];

      let totalResults: any[] = [];
      for (const uid of userIds) {
        const results = await healUser(admin, uid);
        totalResults = totalResults.concat(results);
      }

      return new Response(JSON.stringify({
        mode: "cron",
        users_processed: userIds.length,
        total_issues: totalResults.length,
        resolved: totalResults.filter((r) => r.success).length,
        needs_attention: totalResults.filter((r) => !r.success).length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // User mode: process only authenticated user
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const results = await healUser(admin, user.id);

    return new Response(JSON.stringify({
      mode: "user",
      total_issues: results.length,
      resolved: results.filter((r) => r.success).length,
      needs_attention: results.filter((r) => !r.success).length,
      actions: results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("self-heal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
