import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { dial, phone } = await req.json();
    if (!dial || !phone) {
      return NextResponse.json({ ok: false, error: "Missing dial code or phone number." }, { status: 400 });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!sid || !token || !serviceSid) {
      return NextResponse.json({ ok: false, error: "Twilio server credentials not configured." }, { status: 500 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanDial = dial.startsWith("+") ? dial : `+${dial}`;
    const fullNumber = `${cleanDial}${cleanPhone}`;

    const authHeader = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
    const bodyParams = new URLSearchParams();
    bodyParams.append("To", fullNumber);
    bodyParams.append("Channel", "sms");

    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      }
    );

    const data = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("[Twilio Send OTP Error]", data);
      return NextResponse.json(
        { ok: false, error: data.message || "Failed to send SMS OTP via Twilio." },
        { status: twilioRes.status }
      );
    }

    return NextResponse.json({ ok: true, status: data.status, to: data.to });
  } catch (err: any) {
    console.error("[Twilio Send OTP Exception]", err);
    return NextResponse.json({ ok: false, error: err.message || "Internal server error." }, { status: 500 });
  }
}
