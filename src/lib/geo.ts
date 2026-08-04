/* Client-side helper to detect visitor country code for smart prefill */

export type GeoInfo = {
  countryCode: string; // e.g. "IN", "US", "AE", "GB", "SG", "AU"
  dialCode: string;    // e.g. "+91", "+1", "+971", "+44", "+65", "+61"
  isIndia: boolean;
};

const TIMEZONE_MAP: Record<string, { country: string; dial: string }> = {
  "Asia/Kolkata": { country: "IN", dial: "+91" },
  "Asia/Calcutta": { country: "IN", dial: "+91" },
  "America/New_York": { country: "US", dial: "+1" },
  "America/Los_Angeles": { country: "US", dial: "+1" },
  "America/Chicago": { country: "US", dial: "+1" },
  "America/Toronto": { country: "CA", dial: "+1" },
  "Europe/London": { country: "GB", dial: "+44" },
  "Asia/Dubai": { country: "AE", dial: "+971" },
  "Asia/Singapore": { country: "SG", dial: "+65" },
  "Australia/Sydney": { country: "AU", dial: "+61" },
  "Australia/Melbourne": { country: "AU", dial: "+61" },
};

export async function detectUserCountry(): Promise<GeoInfo> {
  // Default to India (+91)
  let info: GeoInfo = { countryCode: "IN", dialCode: "+91", isIndia: true };

  if (typeof window === "undefined") return info;

  // 1. Fast timezone match
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_MAP[tz]) {
      const match = TIMEZONE_MAP[tz];
      info = {
        countryCode: match.country,
        dialCode: match.dial,
        isIndia: match.country === "IN",
      };
    }
  } catch { /* ignore timezone error */ }

  // 2. Client IP lookup with fast 2.5s timeout
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      const cc = data.country_code || data.country;
      const dial = data.country_calling_code || (cc === "IN" ? "+91" : "+1");

      if (cc) {
        info = {
          countryCode: cc,
          dialCode: dial.startsWith("+") ? dial : `+${dial}`,
          isIndia: cc === "IN",
        };
      }
    }
  } catch { /* fallback to timezone/default */ }

  return info;
}
