"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildApiUrl } from "@/lib/api";

const formatDateTime = (value: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function CheckoutConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const accessCode = useMemo(() => {
    if (typeof window === "undefined" || !id) {
      return null;
    }
    return localStorage.getItem(`competition_${id}_access_code`);
  }, [id]);

  useEffect(() => {
    if (!id || typeof window === "undefined") {
      return;
    }

    const finalizeCheckout = async () => {
      const storedEmail = localStorage.getItem(`competition_${id}_checkout_email`);
      const storedSummary = localStorage.getItem(`competition_${id}_checkout_summary`);
      const participantToken = localStorage.getItem(`competition_${id}_participant_token`);

      setEmail(storedEmail);

      if (!storedSummary || !participantToken) {
        setStatus("error");
        setError("We could not finalise your entry. Please return to the summary screen and try again.");
        return;
      }

      try {
        setError(null);
        setStatus("saving");
        const parsedSummary = JSON.parse(storedSummary) ?? {};
        const completionTimestamp = new Date().toISOString();

        const payload = {
          ...parsedSummary,
          contactEmail: storedEmail ?? parsedSummary.contactEmail ?? null,
          completed: true,
          completedAt: completionTimestamp,
          participant: {
            ...parsedSummary.participant,
            email: storedEmail ?? parsedSummary?.participant?.email ?? null,
          },
        };

        const response = await fetch(buildApiUrl(`competitions/${id}/checkout-summary`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${participantToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          const message = detail?.message || detail?.error || "Failed to finalise your entry.";
          throw new Error(message);
        }

        const result = await response.json().catch(() => ({}));
        const latestSummary = result?.summary ?? payload;

        localStorage.setItem(`competition_${id}_checkout_summary`, JSON.stringify(latestSummary));
        setCompletedAt(latestSummary?.completedAt ?? completionTimestamp);
        setStatus("saved");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to finalise your entry.";
        setError(message);
        setStatus("error");
      }
    };

    void finalizeCheckout();
  }, [id]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleViewSummary = () => {
    router.push(`/competition/${id}/checkout`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <Card className="border-slate-700 bg-slate-900/85 shadow-2xl backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="text-5xl mb-4">🌟</div>
            <CardTitle className="text-3xl text-white">Thank You!</CardTitle>
            <CardDescription className="text-slate-400">
              Your entry has been locked in. We&apos;ve captured your details below.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold text-emerald-200">Entry status</p>
              <p className="mt-1 text-base font-semibold text-white">
                {status === "saved" ? "Completed" : status === "saving" ? "Finalising..." : "Pending"}
              </p>
              {completedAt && (
                <p className="mt-1 text-xs text-emerald-200/80">Completed at {formatDateTime(completedAt)}</p>
              )}
              {accessCode && (
                <p className="mt-3 text-xs text-emerald-200/80">
                  Access code: <span className="font-mono text-emerald-100">{accessCode}</span>
                </p>
              )}
              {email && (
                <p className="mt-1 text-xs text-emerald-200/80">
                  Confirmation email: <span className="font-semibold text-emerald-100 break-all">{email}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={handleGoHome}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-3 font-semibold"
              >
                Go to Home
              </Button>
              <Button
                onClick={handleViewSummary}
                variant="outline"
                className="flex-1 border-slate-400 bg-slate-800/50 text-white font-semibold hover:bg-slate-700 hover:border-slate-300"
              >
                View Entry Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
