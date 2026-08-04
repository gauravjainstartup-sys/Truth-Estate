"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import type { Session } from "@supabase/supabase-js";
import { supabase, claimAnonymousHistory } from "@/lib/phoneAuth";
import { setSignedIn, saveAccount, emptyBuyData } from "@/lib/journey";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unmounted = false;

    async function handleCallback() {
      try {
        const { data: { session: existingSession }, error: authError } = await supabase.auth.getSession();

        if (authError) {
          console.error("[AuthCallback] getSession error:", authError);
          if (!unmounted) setError(authError.message);
          return;
        }

        if (existingSession && existingSession.user) {
          completeLogin(existingSession);
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
          if (s && s.user && !unmounted) {
            subscription.unsubscribe();
            completeLogin(s);
          }
        });

        setTimeout(async () => {
          if (unmounted) return;
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2 && s2.user) {
            subscription.unsubscribe();
            completeLogin(s2);
          } else if (!unmounted) {
            setError("Session verification timed out. Please try signing in again.");
          }
        }, 3000);

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        if (!unmounted) setError(msg);
      }
    }

    function completeLogin(session: Session) {
      const u = session.user;
      const fullName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Member";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("truthEstate.sbSession", JSON.stringify({
          access_token: session.access_token,
          user_id: u.id,
          phone: u.phone || null,
          email: u.email || null,
          provider: "google",
        }));
      }

      setSignedIn();
      saveAccount({
        name: fullName,
        createdAt: Date.now(),
        buy: emptyBuyData,
        booking: null,
      });

      if (session.access_token) {
        claimAnonymousHistory(session.access_token);
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/office";
      window.location.href = next;
    }

    handleCallback();

    return () => {
      unmounted = true;
    };
  }, []);

  return (
    <div
      className="flex min-h-svh w-full items-center justify-center px-6 py-12 text-[#F6F1E8]"
      style={{ background: "radial-gradient(120% 120% at 20% 15%, #241d12, #14110d 62%)" }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-[#c9a96e]/20 bg-[#17130e]/80 p-8 text-center backdrop-blur-md shadow-2xl">
        <div className="flex justify-center mb-6">
          <Logo color="#f6f1e8" className="h-8 w-auto" />
        </div>

        {!error ? (
          <div className="py-4">
            <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-[#c9a96e]/20 border-t-[#c9a96e]" />
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#c9a96e]">Authenticating</p>
            <h2 className="mt-2 font-serif text-[1.4rem] font-medium leading-snug text-[#f6f1e8]">Opening your Private Office</h2>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-[#b3aa9e]/70">Verifying session with Google...</p>
          </div>
        ) : (
          <div className="py-2">
            <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-full bg-[#b3402a]/20 text-[#e05638] text-lg font-serif">
              !
            </div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#e05638]">Sign-In Notice</p>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-[#f6f1e8]/80">{error}</p>
            <button
              onClick={() => (window.location.href = "/office")}
              className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.85rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]"
            >
              Back to Sign In &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
