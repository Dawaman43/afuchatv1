import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AFUMAIL_API_BASE = "https://afuchatmail.vercel.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token } = await req.json();

    if (!access_token || typeof access_token !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing access_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userRes = await fetch(`${AFUMAIL_API_BASE}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });

    const userText = await userRes.text();
    let userInfo: unknown = null;
    try {
      userInfo = userText.trim() ? JSON.parse(userText) : null;
    } catch {
      userInfo = null;
    }

    let mailbox: unknown = null;
    // Only call mailbox when user info doesn't contain an obvious email; client still does robust extraction.
    const emailCandidate =
      userInfo && typeof userInfo === "object"
        ? (userInfo as Record<string, unknown>).email ||
          (userInfo as Record<string, unknown>).mail ||
          (userInfo as Record<string, unknown>).preferred_email ||
          (userInfo as Record<string, unknown>).email_address
        : null;

    if (!emailCandidate) {
      const mailboxRes = await fetch(`${AFUMAIL_API_BASE}/mailbox`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      });

      const mailboxText = await mailboxRes.text();
      try {
        mailbox = mailboxText.trim() ? JSON.parse(mailboxText) : null;
      } catch {
        mailbox = null;
      }

      if (!mailboxRes.ok) {
        console.log("AfuMail /mailbox non-2xx", {
          status: mailboxRes.status,
          bodyPreview: mailboxText.slice(0, 300),
        });
      }
    }

    if (!userRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch AfuMail user info",
          status: userRes.status,
          bodyPreview: userText.slice(0, 500),
        }),
        { status: userRes.status || 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ userInfo, mailbox }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in afumail-userinfo:", message);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
