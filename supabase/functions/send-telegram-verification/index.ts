import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  telegramChatId: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AfuChat <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, telegramChatId }: VerificationRequest = await req.json();

    if (!email || !telegramChatId) {
      return new Response(
        JSON.stringify({ error: "Email and Telegram chat ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching users:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if email exists or not for security
      console.log("User not found for email:", email);
      return new Response(
        JSON.stringify({ success: true, message: "If this email is registered, a verification code will be sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate verification code using the database function
    const { data: code, error: codeError } = await supabase.rpc(
      "generate_telegram_verification_code",
      {
        p_user_id: user.id,
        p_telegram_chat_id: telegramChatId
      }
    );

    if (codeError) {
      console.error("Error generating code:", codeError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle, display_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.display_name || profile?.handle || "there";

    // Send verification email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .code-box { background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 12px; padding: 25px; text-align: center; margin: 20px 0; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: monospace; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .timer { color: #ef4444; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔗 Link Your Telegram Account</h1>
          </div>
          <div class="content">
            <p>Hi ${displayName}! 👋</p>
            <p>Someone is trying to link a Telegram account to your AfuChat profile. If this was you, use this verification code:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p class="timer">⏱️ This code expires in 10 minutes</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              Never share this code with anyone. AfuChat staff will never ask for your verification code. If you didn't request this, please ignore this email.
            </div>
            
            <p>Enter this code in the Telegram bot to complete the linking process.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AfuChat. All rights reserved.</p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await sendEmail(
      email,
      "🔐 Your Telegram Account Linking Code",
      emailHtml
    );

    console.log("Verification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent to your email" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-telegram-verification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
