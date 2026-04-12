import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { social_account_id } = await req.json();
    if (!social_account_id) {
      return new Response(JSON.stringify({ error: "social_account_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: account, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", social_account_id)
      .single();

    if (error || !account) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newAccessToken: string;
    let newExpiresAt: string | null = null;

    if (account.platform === "linkedin") {
      if (!account.refresh_token) {
        return new Response(JSON.stringify({ error: "No refresh token available" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: account.refresh_token,
          client_id: Deno.env.get("LINKEDIN_CLIENT_ID")!,
          client_secret: Deno.env.get("LINKEDIN_CLIENT_SECRET")!,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || "LinkedIn refresh failed");
      newAccessToken = data.access_token;
      newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
    } else if (account.platform === "instagram" || account.platform === "facebook") {
      // Facebook long-lived tokens can be refreshed
      const res = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get("INSTAGRAM_APP_ID")}&client_secret=${Deno.env.get("INSTAGRAM_APP_SECRET")}&fb_exchange_token=${account.access_token}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Facebook refresh failed");
      newAccessToken = data.access_token;
      newExpiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null;
    } else if (account.platform === "twitter") {
      if (!account.refresh_token) {
        return new Response(JSON.stringify({ error: "No refresh token available" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const clientId = Deno.env.get("TWITTER_CLIENT_ID")!;
      const clientSecret = Deno.env.get("TWITTER_CLIENT_SECRET")!;
      const res = await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: account.refresh_token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || "Twitter refresh failed");
      newAccessToken = data.access_token;
      newExpiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null;

      // Also update refresh token if rotated
      if (data.refresh_token) {
        await supabase
          .from("social_accounts")
          .update({ refresh_token: data.refresh_token })
          .eq("id", social_account_id);
      }
    } else {
      return new Response(JSON.stringify({ error: `Refresh not supported for ${account.platform}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update in DB
    await supabase
      .from("social_accounts")
      .update({
        access_token: newAccessToken,
        token_expires_at: newExpiresAt,
        is_active: true,
      })
      .eq("id", social_account_id);

    return new Response(JSON.stringify({ access_token: newAccessToken, expires_at: newExpiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("refresh-social-token error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
