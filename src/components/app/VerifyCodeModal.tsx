"use client";

import { useEffect, useState } from "react";

const CODE_LENGTH = 6;

type Props = {
  visible: boolean;
  email: string;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend?: () => Promise<void>;
  error?: string;
  verifying?: boolean;
  resending?: boolean;
};

export function VerifyCodeModal({
  visible,
  email,
  onClose,
  onVerify,
  onResend,
  error,
  verifying = false,
  resending = false,
}: Props) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!visible) setCode("");
  }, [visible]);

  useEffect(() => {
    if (code.length !== CODE_LENGTH || verifying) return;
    void onVerify(code).catch(() => setCode(""));
  }, [code, onVerify, verifying]);

  if (!visible) return null;

  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? "");

  const handleDigit = (digit: string) => {
    if (verifying || code.length >= CODE_LENGTH) return;
    setCode((prev) => prev + digit);
  };

  const handleBackspace = () => {
    if (verifying) return;
    setCode((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="relative flex h-full w-full max-w-[430px] flex-col bg-background">
        <button
          type="button"
          onClick={onClose}
          disabled={verifying}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted shadow-card"
        >
          ✕
        </button>

        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-3xl text-violet-800">
            ✉
          </div>
          <h2 className="text-center text-xl font-bold">Enter confirmation code</h2>
          <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-muted">
            Please check <strong className="text-brand-black">{email}</strong> for an email from
            Zotheka and enter your code below.
          </p>

          <div className="mt-8 flex gap-2">
            {digits.map((digit, i) => (
              <div
                key={i}
                className="flex h-12 w-10 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold"
              >
                {digit}
              </div>
            ))}
          </div>

          {error ? <p className="mt-4 text-center text-sm font-semibold text-red-500">{error}</p> : null}

          {verifying ? (
            <div className="mt-6 h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          ) : (
            <button
              type="button"
              onClick={() => void onResend?.()}
              disabled={!onResend || resending}
              className="mt-6 text-sm font-semibold text-brand-green disabled:text-muted"
            >
              {resending ? "Sending a new code…" : "Didn't get a code? Resend"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border bg-surface p-4 pb-8">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key) => {
            if (key === "") {
              return <div key="empty" />;
            }
            if (key === "⌫") {
              return (
                <button
                  key="back"
                  type="button"
                  onClick={handleBackspace}
                  className="h-14 rounded-xl bg-background text-lg font-semibold"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDigit(key)}
                className="h-14 rounded-xl bg-background text-xl font-semibold"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
