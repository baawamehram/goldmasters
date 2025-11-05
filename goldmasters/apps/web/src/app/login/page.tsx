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

// Admin credentials
const ADMIN_PHONE = "9464742314";
const ADMIN_NAME = "manan";
const ADMIN_PASSWORD = "yourStrongAdminPassword123";

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
  
  // Admin login state
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

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

    // Check if admin credentials
    const isAdminPhone = trimmedNumber === ADMIN_PHONE;
    const isAdminName = fullName.trim().toLowerCase() === ADMIN_NAME.toLowerCase();

    if (isAdminPhone && isAdminName) {
      // Show admin password page
      setShowAdminPassword(true);
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

  const handleAdminPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError(null);


    try {
      setIsSubmitting(true);
      
      // Call admin login API
      const response = await fetch(buildApiUrl("auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "wish-admin",
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Admin login failed");
      }

      // Store admin token
      localStorage.setItem("admin_token", data?.data?.token);
      localStorage.setItem("admin_user", JSON.stringify(data?.data?.admin));

      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Admin login error:", error);
      setAdminError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackFromPassword = () => {
    setShowAdminPassword(false);
    setAdminPassword("");
    setAdminError(null);
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
                GOLD
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
            {!showAdminPassword ? (
              <>
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
                  placeholder="Enter your full name"
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
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                  autoComplete="tel"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  aria-describedby="phone-help"
                  required
                />
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
          </>
        ) : (
          <>
            {/* Admin Password Page */}
            <div>
              <button
                onClick={handleBackFromPassword}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
              <p className="text-sm text-gray-600 mt-1">
                Enter your admin password to continue
              </p>
            </div>

            <form onSubmit={handleAdminPasswordSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="admin-password" className="block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Admin Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                  autoComplete="current-password"
                  autoFocus
                  disabled={isSubmitting}
                  required
                />
              </div>

              {adminError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-gradient-to-r from-[#055F3C] to-[#0a8f5a] py-3.5 text-base font-bold text-white shadow-lg hover:shadow-xl hover:from-[#044d30] hover:to-[#077a4a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? "Verifying…" : "LOGIN AS ADMIN"}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Admin Panel Access</p>
                    <p>You are logging in as an administrator. This will give you access to manage competitions, assign tickets, and view all participants.</p>
                  </div>
                </div>
              </div>
            </form>
          </>
        )}
          </div>
        </div>
      </div>
    </main>
  );
}
