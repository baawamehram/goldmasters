"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { buildApiUrl } from "@/lib/api";

type CheckoutMarker = {
  id: string;
  ticketId: string;
  ticketNumber?: number;
  x: number;
  y: number;
  locked?: boolean;
};

export interface CheckoutTicket {
  id: string;
  status: string;
  ticketNumber: number;
  markersAllowed?: number;
  markersUsed?: number;
  markers?: Array<{ id: string; x: number; y: number }>;
  submittedAt?: string | null;
}

interface CheckoutResponse {
  participantId?: string;
  tickets?: CheckoutTicket[];
}

interface CheckoutModalProps {
  isOpen: boolean;
  competitionId: string;
  markers: CheckoutMarker[];
  onClose: () => void;
  onSuccess?: (result: CheckoutResponse) => void;
}

export default function CheckoutModal({
  isOpen,
  competitionId,
  markers,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeMarkers = useMemo(
    () => markers.filter((marker) => !marker.locked),
    [markers]
  );

  const markerSummary = useMemo(() => {
    const grouped = new Map<string, { count: number; ticketNumber?: number }>();
    activeMarkers.forEach((marker) => {
      const key = marker.ticketId;
      const existing = grouped.get(key) || { count: 0, ticketNumber: marker.ticketNumber };
      existing.count += 1;
      if (existing.ticketNumber === undefined && marker.ticketNumber !== undefined) {
        existing.ticketNumber = marker.ticketNumber;
      }
      grouped.set(key, existing);
    });
    return Array.from(grouped.entries()).map(([ticketId, info]) => ({
      ticketId,
      ticketNumber: info.ticketNumber,
      count: info.count,
    }));
  }, [activeMarkers]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeMarkers.length) {
      setError("Add markers before completing checkout.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
  const response = await fetch(buildApiUrl(`competitions/${competitionId}/checkout`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password: password.trim(),
          markers: activeMarkers.map((marker) => ({
            ticketId: marker.ticketId,
            ticketNumber: marker.ticketNumber,
            x: Number(marker.x.toFixed(4)),
            y: Number(marker.y.toFixed(4)),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Checkout failed. Please try again.");
      }

      const result: CheckoutResponse = {
        participantId: data?.data?.participantId,
        tickets: data?.data?.tickets,
      };

      setSuccessMessage("Checkout completed successfully. You'll receive a confirmation shortly.");
      onSuccess?.(result);
    } catch (submitError) {
      console.error("Checkout submission error", submitError);
      setError(submitError instanceof Error ? submitError.message : "Unable to complete checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !isSubmitting && onClose()} />
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-modal p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Complete Checkout</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Provide your details to confirm the purchase and lock in your marker selections.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {markerSummary.length > 0 && (
            <div className="mb-4 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/50 p-4">
              <h3 className="text-sm font-semibold mb-2">Markers ready for checkout</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {markerSummary.map((summary) => (
                  <li key={summary.ticketId}>
                    Ticket {summary.ticketNumber ?? summary.ticketId}: {summary.count} markers
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="e.g. Priya Sharma"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Phone number
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  placeholder="10-digit mobile"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
                />
              </label>
            </div>
            <label className="text-xs font-medium text-muted-foreground uppercase block">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground uppercase block">
              Checkout password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Provided by organiser"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
              />
            </label>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-lg border border-input px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Processing..." : "Confirm checkout"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
