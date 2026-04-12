import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const FACEBOOK_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";

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
    const { platform, redirect_uri } = await req.json();

    if (!platform || !redirect_uri) {
      return new Response(JSON.stringify({ error: "platform and redirect_uri required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-auth-callback`;
    const state = btoa(JSON.stringify({ userId, platform, redirect_uri }));

    let authUrl: string;

    if (platform === "linkedin") {
      const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
      if (!clientId) {
        return new Response(JSON.stringify({ error: "LinkedIn not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const scopes = "openid profile email w_member_social";
      authUrl = `${LINKEDIN_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}`;

    } else if (platform === "instagram" || platform === "facebook") {
      const appId = Deno.env.get("INSTAGRAM_APP_ID");
      if (!appId) {
        return new Response(JSON.stringify({ error: "Instagram/Facebook not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const scopes = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";
      authUrl = `${FACEBOOK_AUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}&response_type=code`;

    } else if (platform === "twitter") {
      const clientId = Deno.env.get("TWITTER_CLIENT_ID");
      if (!clientId) {
        return new Response(JSON.stringify({ error: "Twitter/X not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Twitter OAuth 2.0 with PKCE
      const codeChallenge = state.slice(0, 43); // simple challenge for demo; production should use S256
      const scopes = "tweet.read tweet.write users.read offline.access";
      authUrl = `${TWITTER_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}&code_challenge=${codeChallenge}&code_challenge_method=plain`;

    } else {
      return new Response(JSON.stringify({ error: `Platform ${platform} not yet supported for OAuth` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("social-auth-init error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
