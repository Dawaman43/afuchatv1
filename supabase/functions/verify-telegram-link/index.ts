import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  telegramChatId: string;
  verificationCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegramChatId, verificationCode }: VerifyRequest = await req.json();

    if (!telegramChatId || !verificationCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Chat ID and verification code are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid verification code format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the code using the database function
    const { data: result, error: verifyError } = await supabase.rpc(
      "verify_telegram_link",
      {
        p_telegram_chat_id: telegramChatId,
        p_verification_code: verificationCode
      }
    );

    if (verifyError) {
      console.error("Error verifying code:", verifyError);
      return new Response(
        JSON.stringify({ success: false, error: "Verification failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the linked user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url")
      .eq("id", result.user_id)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account linked successfully!",
        user: profile
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-telegram-link:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
