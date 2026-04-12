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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    const healingResults: Array<{
      issue_type: string;
      issue_details: string;
      action_taken: string;
      success: boolean;
      related_resource_id?: string;
      related_resource_type?: string;
    }> = [];

    // 1. Detect failed posts that can be retried
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
        // Reset to queued for retry
        await admin
          .from("scheduled_posts")
          .update({
            status: "queued",
            error_message: null,
            scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // retry in 5 min
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

    // 2. Detect expired tokens
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
        // Token expired — try refresh
        if (account.refresh_token) {
          try {
            const refreshRes = await fetch(
              `${supabaseUrl}/functions/v1/refresh-social-token`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ social_account_id: account.id }),
              }
            );

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
              const errBody = await refreshRes.text();
              // Deactivate account
              await admin
                .from("social_accounts")
                .update({ is_active: false })
                .eq("id", account.id);

              healingResults.push({
                issue_type: "expired_token",
                issue_details: `Token ${account.platform} (@${account.platform_username}) expirado`,
                action_taken: `Refresh falhou (${errBody}). Conta desativada — reconecte manualmente.`,
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
          // No refresh token — deactivate
          await admin
            .from("social_accounts")
            .update({ is_active: false })
            .eq("id", account.id);

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
        // Token expiring within 24h — proactive refresh
        if (account.refresh_token) {
          try {
            const refreshRes = await fetch(
              `${supabaseUrl}/functions/v1/refresh-social-token`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ social_account_id: account.id }),
              }
            );

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
          } catch (_) {
            // Silently fail for proactive refresh
          }
        }
      }
    }

    // 3. Detect stuck "publishing" posts (stuck > 10 min)
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

    // Save healing actions and create notifications
    for (const result of healingResults) {
      await admin.from("healing_actions").insert({
        user_id: userId,
        ...result,
      });

      // Create notification for failures
      if (!result.success) {
        await admin.from("notifications").insert({
          user_id: userId,
          title: `⚠️ Self-Healing: ${result.issue_type.replace(/_/g, " ")}`,
          message: result.action_taken,
          type: "warning",
        });
      }
    }

    const summary = {
      total_issues: healingResults.length,
      resolved: healingResults.filter((r) => r.success).length,
      needs_attention: healingResults.filter((r) => !r.success).length,
      actions: healingResults,
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("self-heal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
