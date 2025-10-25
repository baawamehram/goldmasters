"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api";

interface LoginResponse {
  token: string;
  participant: {
    id: string;
    name: string;
    phone: string;
    ticketsPurchased: number;
  };
  competitions: Array<{
    id: string;
    title: string;
    status: string;
    imageUrl: string;
    pricePerTicket: number;
    markersPerTicket: number;
    endsAt: string;
  }>;
}

const PHONE_REGEX = /^[0-9]{10}$/;

const createLocalId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export default function ParticipantLoginPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existingToken = localStorage.getItem("participant_login_token");
    if (existingToken) {
      router.prefetch("/competitions");
      router.replace("/competitions");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isAdult) {
      setError("Please confirm that you are 18 years old or above.");
      return;
    }

    if (!fullName.trim()) {
      setError("Enter your full name.");
      return;
    }

    const trimmedNumber = phoneNumber.replace(/\s+/g, "");
    if (!PHONE_REGEX.test(trimmedNumber)) {
      setError("Enter a valid phone number.");
      return;
    }

  const fullPhone = `+91${trimmedNumber}`;

    try {
      setIsSubmitting(true);
      const response = await fetch(buildApiUrl("participants/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: fullPhone,
          isAdult: true,
        }),
      });

      const payload = await response.json();

      let data: LoginResponse | null = null;

      if (response.ok) {
        data = payload.data as LoginResponse;
      } else {
        const message =
          payload?.message ||
          payload?.errors?.[0]?.msg ||
          "Unable to sign in with that phone number.";

        if (response.status === 404 || response.status === 400) {
          data = {
            token: `local-${createLocalId()}`,
            participant: {
              id: createLocalId(),
              name: fullName.trim(),
              phone: fullPhone,
              ticketsPurchased: 0,
            },
            competitions: [],
          };
        } else {
          throw new Error(message);
        }
      }

      const token = data?.token ?? `local-${createLocalId()}`;
      const participantProfile = {
        id: data?.participant?.id ?? createLocalId(),
        name: fullName.trim(),
  phone: data?.participant?.phone ?? fullPhone,
        ticketsPurchased: data?.participant?.ticketsPurchased ?? 0,
      };

  const competitions = Array.isArray(data?.competitions) ? data?.competitions : [];

      localStorage.setItem("participant_login_token", token);
      localStorage.setItem("participant_profile", JSON.stringify(participantProfile));
      localStorage.setItem("participant_competitions", JSON.stringify(competitions));

      router.push("/competition");
    } catch (submitError) {
      console.error("Participant login error:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[500px] md:h-[500px] opacity-[0.15]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(5,95,60,0.4),transparent_70%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(5,95,60,0.08)_10px,rgba(5,95,60,0.08)_11px)]" />
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center gap-1.5">
              <span className="text-3xl font-extrabold tracking-[0.25em] text-[#055F3C]">
                WISH
              </span>
              <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#055F3C] to-[#0a8f5a] text-white text-lg font-bold shadow-md">
                ★
              </span>
              <span className="text-3xl font-extrabold tracking-[0.25em] text-[#055F3C]">
                MASTERS
              </span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hi, Welcome!</h1>
              <p className="text-sm text-gray-600 mt-1">
                Hello again, you&apos;ve been missed!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                  autoComplete="name"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Phone
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 min-w-[60px]">
                    +91
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="9876 543 210"
                    className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                    autoComplete="tel"
                    inputMode="numeric"
                    disabled={isSubmitting}
                    aria-describedby="phone-help"
                    required
                  />
                </div>
                <p id="phone-help" className="text-xs text-gray-500">
                  Enter the phone number linked to your invitation.
                </p>
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-800 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAdult}
                  onChange={(event) => setIsAdult(event.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-2 border-gray-300 text-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/30 cursor-pointer transition-all"
                  style={{ accentColor: '#055F3C' }}
                  disabled={isSubmitting}
                />
                <span className="group-hover:text-gray-900 transition-colors">I&apos;m 18 Years Old and above.</span>
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-gradient-to-r from-[#055F3C] to-[#0a8f5a] py-3.5 text-base font-bold text-white shadow-lg hover:shadow-xl hover:from-[#044d30] hover:to-[#077a4a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? "Processing…" : "NEXT"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
