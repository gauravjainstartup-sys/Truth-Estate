// Canonical source of the deployed `send-otp` function (previously existed
// only in the Supabase dashboard). Ship changes via deploy-edge-functions.yml.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return jsonResponse({
      success: false,
      message: "Method not allowed"
    }, 405);
  }
  try {
    const { phone } = await req.json();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return jsonResponse({
        success: false,
        message: "Invalid Indian phone number"
      }, 400);
    }
    const msg91Response = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: Deno.env.get("MSG91_AUTH_KEY") ?? ""
      },
      body: JSON.stringify({
        mobile: `91${phone}`,
        template_id: Deno.env.get("MSG91_TEMPLATE_ID")
      })
    });
    const msg91Data = await msg91Response.json();
    if (!msg91Response.ok) {
      return jsonResponse({
        success: false,
        message: "Failed to send OTP",
        providerResponse: msg91Data
      }, 400);
    }
    return jsonResponse({
      success: true,
      message: "OTP sent successfully",
      providerResponse: msg91Data
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
