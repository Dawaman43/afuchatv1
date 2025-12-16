import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// AfuMail API endpoint
const AFUMAIL_API_URL = "https://afuchatmail.vercel.app";

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

    const endpoints = [
      "/api/oauth/token", // previous guess (common)
      "/oauth/token", // legacy guess
      "/auth/afumail/token", // based on provided callback structure
    ];

    const makeHeaders = (contentType: "application/x-www-form-urlencoded" | "application/json") => ({
      "Content-Type": contentType,
      Accept: "application/json",
      apikey: afumailAnonKey,
      Authorization: `Bearer ${afumailAnonKey}`,
      "X-User-Id": user_id || "",
    });

    const makeBody = (contentType: "application/x-www-form-urlencoded" | "application/json") => {
      if (contentType === "application/json") {
        const payload: Record<string, string> = {
          grant_type,
          client_id: clientId,
          client_secret: clientSecret,
        };
        if (grant_type === "authorization_code" && code) {
          payload.code = code;
          payload.redirect_uri = redirect_uri || "https://afuchat.com/auth/afumail/callback";
        }
        if (grant_type === "refresh_token" && refresh_token) {
          payload.refresh_token = refresh_token;
        }
        return JSON.stringify(payload);
      }
      return formData.toString();
    };

    let lastAttempt: {
      url: string;
      status: number;
      statusText: string;
      bodyPreview: string;
      location?: string | null;
      contentTypeTried: string;
    } | null = null;

    for (const endpoint of endpoints) {
      for (const contentType of [
        "application/x-www-form-urlencoded",
        "application/json",
      ] as const) {
        const url = `${AFUMAIL_API_URL}${endpoint}`;
        console.log(`Calling AfuMail API: ${url} (${contentType})`);
        console.log(`Using redirect_uri: ${redirect_uri}`);

        const response = await fetch(url, {
          method: "POST",
          redirect: "follow",
          headers: makeHeaders(contentType),
          body: makeBody(contentType),
        });

        const responseText = await response.text();
        const location = response.headers.get("location");

        console.log(`AfuMail response status: ${response.status}`);
        console.log(`AfuMail response location: ${location ?? "(none)"}`);
        console.log(
          `AfuMail response body (first 500): ${responseText.slice(0, 500)}`,
        );

        lastAttempt = {
          url,
          status: response.status,
          statusText: response.statusText,
          bodyPreview: responseText.slice(0, 500),
          location,
          contentTypeTried: contentType,
        };

        // Try to parse JSON if possible
        let data: unknown = null;
        if (responseText.trim().length > 0) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // Not JSON; keep trying other endpoints/content-types
            data = null;
          }
        }

        if (response.ok && data) {
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If server returned a structured error, pass it through
        if (!response.ok && data) {
          return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // No endpoint worked.
    return new Response(
      JSON.stringify({
        error: "Invalid response from AfuMail API",
        details: lastAttempt,
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error: unknown) {
    console.error("Error in afumail-auth:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
