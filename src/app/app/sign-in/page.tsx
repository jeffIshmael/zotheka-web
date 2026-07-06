"use client";

import { useLoginWithEmail, useLoginWithOAuth } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleIcon } from "@/components/app/GoogleIcon";
import { VerifyCodeModal } from "@/components/app/VerifyCodeModal";
import { getMonitor } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isPrivyConfigured } from "@/lib/privy-config";
import { resolveUsdToMwkRate } from "@/lib/config";

function authErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (message) return message;
  return "Something went wrong. Please try again.";
}

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [rate, setRate] = useState(1700);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [authError, setAuthError] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const goToApp = () => router.replace("/app");

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onComplete: () => {
      setShowVerify(false);
      goToApp();
    },
    onError: (error) => {
      setVerifyError(authErrorMessage(error));
    },
  });

  const { initOAuth, state: googleState } = useLoginWithOAuth({
    onComplete: () => {
      goToApp();
    },
    onError: (error) => {
      setAuthError(authErrorMessage(error));
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      goToApp();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    getMonitor()
      .then((m) => setRate(resolveUsdToMwkRate(m.usd_to_mwk_rate)))
      .catch(() => undefined);
  }, []);

  const emailValid = email.includes("@") && email.includes(".");
  const emailBusy =
    emailState.status === "sending-code" || emailState.status === "submitting-code";
  const googleBusy = googleState.status === "loading";

  const handleEmailContinue = async () => {
    if (!emailValid || !isPrivyConfigured) return;
    setAuthError("");
    setVerifyError("");
    try {
      await sendCode({ email });
      setShowVerify(true);
    } catch (error) {
      setAuthError(authErrorMessage(error));
    }
  };

  const handleVerifyCode = async (code: string) => {
    setVerifyError("");
    try {
      await loginWithCode({ code });
    } catch (error) {
      setVerifyError(authErrorMessage(error));
      throw error;
    }
  };

  const handleResendCode = async () => {
    setVerifyError("");
    await sendCode({ email });
  };

  const handleGoogleContinue = async () => {
    if (!isPrivyConfigured) return;
    setAuthError("");
    try {
      await initOAuth({ provider: "google" });
    } catch (error) {
      setAuthError(authErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative flex-[0.54] shrink-0 overflow-hidden bg-brand-green px-6 pb-8 pt-10 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 opacity-20">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-20 w-1.5 origin-bottom rounded-full bg-white"
              style={{ transform: `rotate(${(i - 6.5) * 9}deg)` }}
            />
          ))}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-2xl font-extrabold">
            Z
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-bold">
            ⇄ 1 USD ≈ {rate.toLocaleString()} MWK
          </div>
        </div>

        <div className="relative mt-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Zotheka</h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/90">
            Netflix, Spotify &amp; more, paid with your mobile money.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Netflix", "Spotify", "Google Play"].map((brand) => (
              <span
                key={brand}
                className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-semibold"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-9 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[36px] bg-surface">
        <div className="flex-1 px-6 pt-8 pb-6">
          <h2 className="text-xl font-extrabold">Create your account</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Sign up in seconds. Track purchases and withdraw USD to MWK anytime.
          </p>

          {!isPrivyConfigured ? (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Add your Privy keys to <code className="font-mono">.env</code> to enable sign-in.
              Use a <strong>Web</strong> client ID from the Privy dashboard.
            </div>
          ) : null}

          {authError ? (
            <p className="mt-4 text-sm leading-relaxed text-red-500">{authError}</p>
          ) : null}

          <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              setEmailExpanded((prev) => !prev);
              setAuthError("");
            }}
            className={`flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border bg-surface text-[15px] font-semibold transition ${
              emailExpanded ? "border-brand-green bg-brand-green/5" : "border-border"
            }`}
          >
            <span className="text-brand-green">✉</span>
            Continue with Email
          </button>

          {emailExpanded && (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={emailBusy}
                className="h-[46px] flex-1 rounded-xl border border-border px-4 text-[15px] outline-none ring-brand-green focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void handleEmailContinue()}
                disabled={!emailValid || emailBusy || !isPrivyConfigured}
                className="min-w-[96px] rounded-xl bg-brand-green px-4 text-sm font-bold text-white disabled:bg-border disabled:text-muted"
              >
                {emailBusy ? "…" : "Continue"}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold tracking-wide text-muted">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => void handleGoogleContinue()}
            disabled={googleBusy || !isPrivyConfigured}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-[15px] font-semibold disabled:opacity-60"
          >
            {googleBusy ? (
              <span className="text-sm text-muted">Connecting…</span>
            ) : (
              <>
                <GoogleIcon size={20} />
                Continue with Google
              </>
            )}
          </button>

          <button
            type="button"
            disabled
            className="mt-2 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-brand-black bg-brand-black text-[15px] font-semibold text-white opacity-90"
          >
            Continue with Apple
          </button>
        </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-muted">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <VerifyCodeModal
        visible={showVerify}
        email={email}
        onClose={() => {
          if (!emailBusy) setShowVerify(false);
        }}
        onVerify={handleVerifyCode}
        onResend={handleResendCode}
        error={verifyError}
        verifying={emailState.status === "submitting-code"}
        resending={emailState.status === "sending-code"}
      />
    </div>
  );
}
