// Canonical source of the deployed `verify-otp` function (previously existed
// only in the Supabase dashboard). Ship changes via deploy-edge-functions.yml.
// Called service-to-service by chat-signin after MSG91 sends the code; issues
// the 30d HS256 session JWT (JWT_SECRET) that chat-signin re-wraps.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { SignJWT } from "https://esm.sh/jose@5.9.6";
const FUNCTION_NAME = "verify-otp";
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
function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  try {
    return JSON.parse(JSON.stringify(error));
  } catch {
    return String(error);
  }
}
function logInfo(step, data) {
  console.log(JSON.stringify({
    level: "info",
    function: FUNCTION_NAME,
    step,
    data,
    timestamp: new Date().toISOString()
  }));
}
function logError(step, error, extra) {
  console.error(JSON.stringify({
    level: "error",
    function: FUNCTION_NAME,
    step,
    error: serializeError(error),
    extra,
    timestamp: new Date().toISOString()
  }));
}
async function createJwt(payload) {
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }
  const encodedSecret = new TextEncoder().encode(secret);
  return await new SignJWT(payload).setProtectedHeader({
    alg: "HS256",
    typ: "JWT"
  }).setIssuedAt().setExpirationTime("30d").sign(encodedSecret);
}
async function findAuthUserByPhone(supabase, phoneWithCountryCode, requestId) {
  const maxPages = 20;
  const perPage = 1000;
  for(let page = 1; page <= maxPages; page++){
    logInfo("auth_user_lookup_page_started", {
      requestId,
      page,
      perPage
    });
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) {
      logError("auth_user_lookup_failed", error, {
        requestId,
        page
      });
      throw error;
    }
    const users = data?.users || [];
    const matchedUser = users.find((u)=>{
      return String(u.phone || "") === phoneWithCountryCode;
    });
    if (matchedUser) {
      logInfo("auth_user_lookup_matched", {
        requestId,
        authUserId: matchedUser.id,
        phone: matchedUser.phone
      });
      return {
        id: matchedUser.id,
        phone: matchedUser.phone
      };
    }
    if (users.length < perPage) {
      break;
    }
  }
  logInfo("auth_user_lookup_not_found", {
    requestId,
    phoneWithCountryCode
  });
  return null;
}
serve(async (req)=>{
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  logInfo("request_started", {
    requestId,
    method: req.method,
    url: req.url
  });
  if (req.method !== "POST") {
    return jsonResponse({
      success: false,
      requestId,
      step: "method_check",
      message: "Method not allowed. Use POST."
    }, 405);
  }
  try {
    let body;
    try {
      body = await req.json();
      logInfo("request_body_parsed", {
        requestId,
        hasPhone: Boolean(body?.phone),
        hasOtp: Boolean(body?.otp)
      });
    } catch (error) {
      logError("parse_request_body", error, {
        requestId
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "parse_request_body",
        message: "Invalid JSON body",
        error: serializeError(error)
      }, 400);
    }
    const phone = String(body?.phone || "").trim();
    const otp = String(body?.otp || "").trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    const otpRegex = /^\d{4,8}$/;
    if (!phoneRegex.test(phone)) {
      logError("validate_phone", "Invalid phone number", {
        requestId,
        phone
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "validate_phone",
        message: "Invalid phone number. Send only 10 digit Indian mobile number without +91."
      }, 400);
    }
    if (!otpRegex.test(otp)) {
      logError("validate_otp", "Invalid OTP format", {
        requestId,
        otpLength: otp.length
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "validate_otp",
        message: "Invalid OTP format"
      }, 400);
    }
    logInfo("input_validation_success", {
      requestId,
      phone,
      otpLength: otp.length
    });
    const msg91AuthKey = Deno.env.get("MSG91_AUTH_KEY");
    // Key resolution matches the fleet: prefer the revocable per-consumer
    // secrets (EDGE_DB_KEY, platform-injected SUPABASE_URL); the second name
    // in each pair is the pre-migration custom secret this function shipped
    // with, kept so either secret set can serve it.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("URL_SUPABASE");
    const serviceRoleKey = Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY_SUPABASE");
    const jwtSecret = Deno.env.get("JWT_SECRET");
    logInfo("environment_check", {
      requestId,
      hasMsg91AuthKey: Boolean(msg91AuthKey),
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasJwtSecret: Boolean(jwtSecret)
    });
    if (!msg91AuthKey) {
      return jsonResponse({
        success: false,
        requestId,
        step: "env_msg91_auth_key",
        message: "MSG91_AUTH_KEY is missing in Supabase secrets"
      }, 500);
    }
    if (!supabaseUrl) {
      return jsonResponse({
        success: false,
        requestId,
        step: "env_supabase_url",
        message: "SUPABASE_URL / URL_SUPABASE is missing in Supabase secrets"
      }, 500);
    }
    if (!serviceRoleKey) {
      return jsonResponse({
        success: false,
        requestId,
        step: "env_service_role_key",
        message: "EDGE_DB_KEY / SERVICE_ROLE_KEY_SUPABASE is missing in Supabase secrets"
      }, 500);
    }
    if (!jwtSecret) {
      return jsonResponse({
        success: false,
        requestId,
        step: "env_jwt_secret",
        message: "JWT_SECRET is missing in Supabase secrets"
      }, 500);
    }
    const verifyUrl = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=91${phone}`;
    logInfo("msg91_verify_started", {
      requestId,
      phone
    });
    let msg91Data;
    try {
      const msg91Response = await fetch(verifyUrl, {
        method: "GET",
        headers: {
          authkey: msg91AuthKey
        }
      });
      const rawText = await msg91Response.text();
      logInfo("msg91_raw_response", {
        requestId,
        status: msg91Response.status,
        ok: msg91Response.ok,
        rawText
      });
      try {
        msg91Data = JSON.parse(rawText);
      } catch {
        msg91Data = {
          rawText
        };
      }
    } catch (error) {
      logError("msg91_fetch_failed", error, {
        requestId,
        phone
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "msg91_fetch_failed",
        message: "Failed to call MSG91 verify API",
        error: serializeError(error)
      }, 500);
    }
    const providerMessage = String(msg91Data?.message || "").toLowerCase();
    const isOtpVerified = msg91Data?.type === "success" || providerMessage.includes("already verified");
    if (!isOtpVerified) {
      logError("msg91_otp_not_verified", msg91Data, {
        requestId,
        phone
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "msg91_otp_not_verified",
        message: "Invalid or expired OTP",
        providerResponse: msg91Data
      }, 400);
    }
    logInfo("msg91_otp_verified", {
      requestId,
      phone,
      providerResponse: msg91Data
    });
    let supabase;
    try {
      supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      logInfo("supabase_client_created", {
        requestId
      });
    } catch (error) {
      logError("supabase_client_create_failed", error, {
        requestId
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "supabase_client_create_failed",
        message: "Failed to create Supabase client",
        error: serializeError(error)
      }, 500);
    }
    logInfo("fetch_user_profile_by_phone_started", {
      requestId,
      phone
    });
    const { data: existingUserByPhone, error: fetchUserByPhoneError } = await supabase.from("user_profiles").select("id, phone, created_at").eq("phone", phone).maybeSingle();
    if (fetchUserByPhoneError) {
      logError("fetch_user_profile_by_phone_failed", fetchUserByPhoneError, {
        requestId,
        phone
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "fetch_user_profile_by_phone_failed",
        message: "Failed to fetch user profile by phone",
        supabaseError: fetchUserByPhoneError
      }, 500);
    }
    let user = existingUserByPhone;
    logInfo("fetch_user_profile_by_phone_completed", {
      requestId,
      userFound: Boolean(user),
      user
    });
    if (!user) {
      logInfo("create_user_flow_started", {
        requestId,
        phone
      });
      const phoneWithCountryCode = `+91${phone}`;
      let authUserId = null;
      const { data: authUserData, error: authUserCreateError } = await supabase.auth.admin.createUser({
        phone: phoneWithCountryCode,
        phone_confirm: true,
        user_metadata: {
          phone,
          auth_provider: "msg91"
        }
      });
      if (authUserCreateError) {
        logError("auth_user_create_failed", authUserCreateError, {
          requestId,
          phone,
          phoneWithCountryCode
        });
        const authMessage = String(authUserCreateError?.message || "").toLowerCase();
        const maybeAlreadyExists = authMessage.includes("already") || authMessage.includes("registered") || authMessage.includes("duplicate") || authMessage.includes("exists");
        if (!maybeAlreadyExists) {
          return jsonResponse({
            success: false,
            requestId,
            step: "auth_user_create_failed",
            message: "Failed to create Supabase Auth user",
            supabaseError: authUserCreateError
          }, 500);
        }
        logInfo("auth_user_already_exists_lookup_started", {
          requestId,
          phoneWithCountryCode
        });
        try {
          const existingAuthUser = await findAuthUserByPhone(supabase, phoneWithCountryCode, requestId);
          if (!existingAuthUser) {
            return jsonResponse({
              success: false,
              requestId,
              step: "auth_user_exists_but_not_found",
              message: "Supabase Auth says phone may already exist, but auth user could not be found.",
              supabaseError: authUserCreateError
            }, 500);
          }
          authUserId = existingAuthUser.id;
        } catch (error) {
          logError("auth_user_lookup_exception", error, {
            requestId,
            phoneWithCountryCode
          });
          return jsonResponse({
            success: false,
            requestId,
            step: "auth_user_lookup_exception",
            message: "Failed to lookup existing Supabase Auth user",
            error: serializeError(error)
          }, 500);
        }
      } else {
        authUserId = authUserData?.user?.id || null;
        logInfo("auth_user_create_completed", {
          requestId,
          authUserId,
          phoneWithCountryCode
        });
      }
      if (!authUserId) {
        logError("auth_user_id_missing", "Auth user id is missing", {
          requestId,
          phone
        });
        return jsonResponse({
          success: false,
          requestId,
          step: "auth_user_id_missing",
          message: "Auth user id missing after create or lookup"
        }, 500);
      }
      logInfo("check_user_profile_by_auth_id_started", {
        requestId,
        authUserId,
        phone
      });
      const { data: existingUserById, error: fetchUserByIdError } = await supabase.from("user_profiles").select("id, phone, created_at").eq("id", authUserId).maybeSingle();
      if (fetchUserByIdError) {
        logError("check_user_profile_by_auth_id_failed", fetchUserByIdError, {
          requestId,
          authUserId,
          phone
        });
        return jsonResponse({
          success: false,
          requestId,
          step: "check_user_profile_by_auth_id_failed",
          message: "Failed to check existing profile by auth user id",
          supabaseError: fetchUserByIdError
        }, 500);
      }
      if (existingUserById) {
        logInfo("user_profile_already_exists_by_auth_id", {
          requestId,
          authUserId,
          existingUserById
        });
        if (!existingUserById.phone || existingUserById.phone !== phone) {
          logInfo("update_existing_user_profile_phone_started", {
            requestId,
            authUserId,
            oldPhone: existingUserById.phone,
            newPhone: phone
          });
          const { data: updatedUser, error: updateUserError } = await supabase.from("user_profiles").update({
            phone
          }).eq("id", authUserId).select("id, phone, created_at").single();
          if (updateUserError) {
            logError("update_existing_user_profile_phone_failed", updateUserError, {
              requestId,
              authUserId,
              phone
            });
            return jsonResponse({
              success: false,
              requestId,
              step: "update_existing_user_profile_phone_failed",
              message: "Failed to update existing user profile phone",
              supabaseError: updateUserError
            }, 500);
          }
          user = updatedUser;
        } else {
          user = existingUserById;
        }
      } else {
        logInfo("upsert_user_profile_started", {
          requestId,
          authUserId,
          phone
        });
        const { data: upsertedUser, error: upsertUserError } = await supabase.from("user_profiles").upsert({
          id: authUserId,
          phone
        }, {
          onConflict: "id"
        }).select("id, phone, created_at").single();
        if (upsertUserError) {
          logError("upsert_user_profile_failed", upsertUserError, {
            requestId,
            phone,
            authUserId
          });
          return jsonResponse({
            success: false,
            requestId,
            step: "upsert_user_profile_failed",
            message: "Failed to create or update user profile",
            supabaseError: upsertUserError,
            likelyCause: "Check NOT NULL columns, phone unique constraint, or trigger behavior in user_profiles."
          }, 500);
        }
        user = upsertedUser;
        logInfo("upsert_user_profile_completed", {
          requestId,
          user
        });
      }
    }
    if (!user) {
      logError("user_missing_after_fetch_or_create", "User is null", {
        requestId,
        phone
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "user_missing_after_fetch_or_create",
        message: "Unable to fetch or create user profile"
      }, 500);
    }
    logInfo("jwt_create_started", {
      requestId,
      userId: user.id,
      phone: user.phone
    });
    let token;
    try {
      token = await createJwt({
        userId: user.id,
        phone: user.phone
      });
      logInfo("jwt_create_completed", {
        requestId,
        userId: user.id
      });
    } catch (error) {
      logError("jwt_create_failed", error, {
        requestId,
        user
      });
      return jsonResponse({
        success: false,
        requestId,
        step: "jwt_create_failed",
        message: "Failed to create JWT token",
        error: serializeError(error)
      }, 500);
    }
    logInfo("verify_otp_success", {
      requestId,
      userId: user.id,
      phone: user.phone
    });
    return jsonResponse({
      success: true,
      requestId,
      message: "OTP verified successfully",
      token,
      user
    }, 200);
  } catch (error) {
    logError("unhandled_exception", error, {
      requestId
    });
    return jsonResponse({
      success: false,
      requestId,
      step: "unhandled_exception",
      message: "Internal server error",
      error: serializeError(error)
    }, 500);
  }
});
