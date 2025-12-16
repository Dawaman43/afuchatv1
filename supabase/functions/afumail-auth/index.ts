import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// AfuMail OAuth token endpoint (direct)
const AFUMAIL_OAUTH_TOKEN_URL = "https://afuchatmail.lovable.app/oauth/token";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { grant_type, code, refresh_token, user_id, redirect_uri } =
      await req.json();

    const clientId = Deno.env.get("AFUMAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("AFUMAIL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Missing AfuMail credentials");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${grant_type} request for user: ${user_id}`);

    // Build form data for token exchange
    const formData = new URLSearchParams();
    formData.append("grant_type", grant_type);
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);

    if (grant_type === "authorization_code" && code) {
      formData.append("code", code);
      // Must match redirect_uri used in the authorization request
      formData.append(
        "redirect_uri",
        redirect_uri || "https://afuchat.com/auth/afumail/callback",
      );
    } else if (grant_type === "refresh_token" && refresh_token) {
      formData.append("refresh_token", refresh_token);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid grant_type or missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Calling AfuMail OAuth token endpoint: ${AFUMAIL_OAUTH_TOKEN_URL}`);
    console.log(`Using redirect_uri: ${redirect_uri}`);

    const response = await fetch(AFUMAIL_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    console.log(`AfuMail response status: ${response.status}`);

    if (!response.ok) {
      console.error("AfuMail OAuth token error:", data);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in afumail-auth:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
