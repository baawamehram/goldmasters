"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutAccessCodePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedAccessCode = localStorage.getItem(`competition_${id}_access_code`);
    if (storedAccessCode) {
      setAccessCode(storedAccessCode.toUpperCase());
    }

    const storedEmail = localStorage.getItem(`competition_${id}_checkout_email`);
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessCode.trim()) {
      setError("Please enter your access code");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Store access code for later use
      localStorage.setItem(`competition_${id}_access_code`, accessCode);
      localStorage.setItem(`competition_${id}_checkout_email`, normalizedEmail);

      // Redirect to payment or confirmation page
      router.push(`/competition/${id}/checkout/confirm`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to proceed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-900/80 shadow-2xl backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl mb-4">🎫</div>
            <CardTitle className="text-2xl text-white">Checkout</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your access code and email to wrap up checkout
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Access Code Input */}
              <div className="space-y-2">
                <label htmlFor="accessCode" className="block text-sm font-medium text-slate-300">
                  Access Code
                </label>
                <input
                  id="accessCode"
                  type="text"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                  maxLength={20}
                />
                <p className="text-xs text-slate-500">
                  You received this code when registering for the competition
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">We&apos;ll use this to send your confirmation.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !accessCode.trim() || !email.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Done"}
              </Button>

              {/* Back Button */}
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="w-full border-slate-700 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                disabled={isLoading}
              >
                Back to Summary
              </Button>
            </form>

            {/* Info Box */}
            <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-200">
                <strong>💡 Tip:</strong> Your access code is a unique identifier provided to you during registration. Keep it safe and secure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>🔒 Your information is securely encrypted and protected</p>
        </div>
      </div>
    </main>
  );
}
