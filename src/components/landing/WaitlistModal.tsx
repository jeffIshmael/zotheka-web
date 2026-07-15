"use client";
import { useEffect, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

export function WaitlistModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [whatsappVal, setWhatsappVal] = useState("");
  const [usecaseType, setUsecaseType] = useState("");

  useEffect(() => {
    const handleHashChange = () => {
      setIsOpen(window.location.hash === "#waitlist");
    };

    // Initial check
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const close = () => {
    setIsOpen(false);
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    // Reset state after animation
    setTimeout(() => {
      setSuccess(false);
      setPosition(null);
      setError(null);
      setPhoneError(null);
      setWhatsappVal("");
      setUsecaseType("");
    }, 300);
  };

  const validatePhone = (val: string) => {
    if (!val.trim()) return null; // Optional field
    const clean = val.replace(/\D/g, "");
    if (clean.length < 8 || clean.length > 10) {
      return "Please enter a valid Malawian phone number (e.g., 999 123 456).";
    }
    return null;
  };

  const handlePhoneBlur = () => {
    setPhoneError(validatePhone(whatsappVal));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPhoneError(null);

    const formData = new FormData(e.currentTarget);
    
    // Optional phone validation
    let finalWhatsapp = "";
    if (whatsappVal.trim()) {
      const err = validatePhone(whatsappVal);
      if (err) {
        setPhoneError(err);
        setLoading(false);
        return;
      }
      const cleanWhatsapp = whatsappVal.replace(/\D/g, "");
      finalWhatsapp = `+265 ${cleanWhatsapp}`.trim();
    }
    
    let usecase = formData.get("usecase");
    if (usecase === "Other") {
      const otherValue = formData.get("otherUsecase");
      if (otherValue) {
        usecase = `Other: ${otherValue}`;
      }
    }

    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      whatsapp: finalWhatsapp,
      usecase,
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to join waitlist");
      }

      setSuccess(true);
      setPosition(json.position);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C0C] p-6 shadow-2xl">
        <button
          onClick={close}
          className="absolute right-4 top-4 text-white/50 hover:text-white"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/20 text-brand-green mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">
              🎉 You're #{position} on the waitlist.
            </h3>
            <p className="text-white/60 text-sm mb-6">
              Estimated beta: August 2026. We will reach out as soon as we're ready!
            </p>
            <button
              onClick={close}
              className="w-full rounded-full bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-white mb-1">Join the Waitlist</h2>
            <p className="text-sm text-white/60 mb-6">
              Be the first to access Zotheka when we launch.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wide text-white/70 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green transition"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-white/70 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green transition"
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-xs font-bold uppercase tracking-wide text-white/70 mb-1.5">
                  WhatsApp Number <span className="text-white/30 lowercase font-normal tracking-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🇲🇼</span>
                    <input
                      id="countryCode"
                      name="countryCode"
                      type="text"
                      readOnly
                      defaultValue="+265"
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-3 text-white focus:outline-none transition text-sm cursor-not-allowed opacity-80"
                    />
                  </div>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    value={whatsappVal}
                    onChange={(e) => {
                      // Only allow numbers and spaces
                      const val = e.target.value.replace(/[^\d\s]/g, "");
                      setWhatsappVal(val);
                      if (phoneError) setPhoneError(null);
                    }}
                    onBlur={handlePhoneBlur}
                    placeholder="999 123 456"
                    className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 transition ${
                      phoneError 
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" 
                        : "border-white/10 focus:border-brand-green focus:ring-brand-green"
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="mt-1.5 text-xs text-red-500">{phoneError}</p>
                )}
              </div>

              <div>
                <label htmlFor="usecase" className="block text-xs font-bold uppercase tracking-wide text-white/70 mb-1.5">
                  What do you want to use Zotheka for? <span className="text-red-500">*</span>
                </label>
                <select
                  id="usecase"
                  name="usecase"
                  required
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green transition"
                  value={usecaseType}
                  onChange={(e) => setUsecaseType(e.target.value)}
                >
                  <option value="" disabled className="text-black">Select an option</option>
                  <option value="Pay for netflix, spotify and others" className="text-black">🌍 Pay for netflix, spotify and others </option>
                  <option value="Receive freelance payments" className="text-black">💼 Receive freelance payments</option>
                  <option value="Save MWK in USD" className="text-black">💵 Save your MWK in USD</option>
                  <option value="Pay online with USD" className="text-black">💳 Pay online with USD</option>
                  <option value="Withdraw USD/EUR to MWK" className="text-black">💸 Withdraw USD/EUR to MWK</option>
                  <option value="Other" className="text-black">Other</option>
                </select>
              </div>

              {usecaseType === "Other" && (
                <div className="mt-4">
                  <label htmlFor="otherUsecase" className="block text-xs font-bold uppercase tracking-wide text-white/70 mb-1.5">
                    Please describe <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="otherUsecase"
                    name="otherUsecase"
                    type="text"
                    required
                    placeholder="How would you like to use Zotheka?"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-brand-green px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Joining..." : "Join Waitlist"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
