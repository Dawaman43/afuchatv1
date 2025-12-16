import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// AfuMail token exchange (AfuChat must call this exact endpoint)
const AFUMAIL_TOKEN_EXCHANGE_URL =
  "https://vfcukxlzqfeehhkiogpf.supabase.co/functions/v1/afumail-api/oauth/token";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      grant_type,
      code,
      refresh_token,
      user_id,
      redirect_uri,
      client_id,
    } = await req.json();

    // Always use server-side OAuth credentials to avoid client/server mismatches.
    const clientId = Deno.env.get("AFUMAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("AFUMAIL_CLIENT_SECRET");
    const afumailAnonKey = Deno.env.get("AFUMAIL_API_ANON_KEY");

    // Log only non-sensitive info for debugging.
    console.log("AfuMail OAuth config loaded", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasAfuMailAnonKey: !!afumailAnonKey,
      providedClientId: !!client_id,
    });

    if (!clientId || !clientSecret) {
      console.error("Missing AfuMail credentials", {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!afumailAnonKey) {
      console.error("Missing AFUMAIL_API_ANON_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error - missing API key" }), {
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

    // NOTE: AfuChat's AfuMail token exchange MUST use the exact endpoint below.
    // If this changes, update AFUMAIL_TOKEN_EXCHANGE_URL.
    console.log(`Calling AfuMail token exchange: ${AFUMAIL_TOKEN_EXCHANGE_URL}`);
    console.log(`Using redirect_uri: ${redirect_uri}`);

    const response = await fetch(AFUMAIL_TOKEN_EXCHANGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        // This endpoint lives behind a Supabase edge function; it typically expects an anon key.
        apikey: afumailAnonKey,
        Authorization: `Bearer ${afumailAnonKey}`,
        "X-User-Id": user_id || "",
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log(`AfuMail token exchange status: ${response.status}`);
    console.log(
      `AfuMail token exchange body (first 500): ${responseText.slice(0, 500)}`,
    );

    let parsed: unknown = null;
    if (responseText.trim().length > 0) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      // If remote returns JSON error, pass it through; otherwise include a preview.
      return new Response(
        JSON.stringify(
          parsed ?? {
            error: "AfuMail token exchange failed",
            status: response.status,
            statusText: response.statusText,
            bodyPreview: responseText.slice(0, 500),
          },
        ),
        { status: response.status || 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON from AfuMail token exchange",
          bodyPreview: responseText.slice(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(parsed), {
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
