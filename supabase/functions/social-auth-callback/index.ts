import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  let code: string | null;
  let stateStr: string | null;
  let error: string | null;

  if (req.method === "GET") {
    code = url.searchParams.get("code");
    stateStr = url.searchParams.get("state");
    error = url.searchParams.get("error");
  } else if (req.method === "POST") {
    const body = await req.json();
    code = body.code;
    stateStr = body.state;
    error = null;
  } else if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  } else {
    return new Response("Method not allowed", { status: 405 });
  }

  if (error) {
    return redirectWithError(error);
  }

  if (!code || !stateStr) {
    return redirectWithError("Missing code or state");
  }

  try {
    const state = JSON.parse(atob(decodeURIComponent(stateStr)));
    const { userId, platform, redirect_uri } = state;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-auth-callback`;

    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let platformUserId: string | null = null;
    let platformUsername: string | null = null;
    let scopes: string[] = [];

    if (platform === "linkedin") {
      const clientId = Deno.env.get("LINKEDIN_CLIENT_ID")!;
      const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;

      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error_description || "LinkedIn token exchange failed");

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || null;
      expiresIn = tokenData.expires_in;
      scopes = (tokenData.scope || "").split(" ");

      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await profileRes.json();
      platformUserId = profile.sub;
      platformUsername = profile.name || profile.email;

    } else if (platform === "instagram" || platform === "facebook") {
      const appId = Deno.env.get("INSTAGRAM_APP_ID")!;
      const appSecret = Deno.env.get("INSTAGRAM_APP_SECRET")!;

      const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: callbackUrl,
          code,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error?.message || "Facebook token exchange failed");

      const longRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
      );
      const longData = await longRes.json();

      accessToken = longData.access_token || tokenData.access_token;
      expiresIn = longData.expires_in || tokenData.expires_in;
      scopes = ["instagram_basic", "instagram_content_publish"];

      const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`);
      const me = await meRes.json();
      platformUserId = me.id;
      platformUsername = me.name;

    } else if (platform === "twitter") {
      const clientId = Deno.env.get("TWITTER_CLIENT_ID")!;
      const clientSecret = Deno.env.get("TWITTER_CLIENT_SECRET")!;

      // PKCE code verifier = the state used as plain challenge
      const codeVerifier = stateStr.slice(0, 43);

      const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
          code_verifier: codeVerifier,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error_description || tokenData.detail || "Twitter token exchange failed");

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || null;
      expiresIn = tokenData.expires_in;
      scopes = (tokenData.scope || "").split(" ");

      // Fetch user info
      const meRes = await fetch("https://api.x.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const meData = await meRes.json();
      platformUserId = meData.data?.id;
      platformUsername = meData.data?.username;

    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Upsert social account
    const { error: dbError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: userId,
          platform,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt,
          platform_user_id: platformUserId,
          platform_username: platformUsername,
          scopes,
          is_active: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("DB upsert error:", dbError);
      await supabase.from("social_accounts").insert({
        user_id: userId,
        platform,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        scopes,
        is_active: true,
      });
    }

    // Redirect back to frontend
    if (req.method === "GET") {
      const frontendUrl = redirect_uri || Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".lovable.app");
      return new Response(null, {
        status: 302,
        headers: { Location: `${frontendUrl}?platform=${platform}&success=true` },
      });
    }

    return new Response(JSON.stringify({ success: true, platform }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("social-auth-callback error:", err);
    if (req.method === "GET") {
      return redirectWithError(err.message);
    }
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
});

function redirectWithError(msg: string) {
  const safe = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  return new Response(`<html><body><p>Error: ${safe}</p><script>setTimeout(()=>window.close(),3000)</script></body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
