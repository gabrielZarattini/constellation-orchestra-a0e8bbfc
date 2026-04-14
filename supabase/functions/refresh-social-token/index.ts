import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { social_account_id } = await req.json();
    if (!social_account_id) {
      return new Response(JSON.stringify({ error: "social_account_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: account, error } = await admin
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

    // Ownership check
    if (account.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
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

      if (data.refresh_token) {
        await admin
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

    await admin
      .from("social_accounts")
      .update({
        access_token: newAccessToken,
        token_expires_at: newExpiresAt,
        is_active: true,
      })
      .eq("id", social_account_id);

    // Don't return the access token — callers should read it server-side
    return new Response(JSON.stringify({ success: true, expires_at: newExpiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("refresh-social-token error:", err);
    return new Response(JSON.stringify({ error: "Token refresh failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
