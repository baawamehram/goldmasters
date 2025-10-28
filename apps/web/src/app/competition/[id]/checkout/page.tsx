"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { buildApiUrl } from "@/lib/api";

interface StoredMarker {
  id: string;
  ticketId: string;
  ticketNumber: number;
  x: number;
  y: number;
  label: string;
}

interface CompetitionSummary {
  id: string;
  title: string;
  imageUrl: string;
  pricePerTicket: number;
  markersPerTicket: number;
  status: string;
}

interface ParticipantSummary {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  ticketsPurchased: number;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
const formatNormalized = (value: number) => value.toFixed(4);

export default function CompetitionCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const checkoutMarkersKey = `competition_${id}_checkout_markers`;
  const participantInfoKey = `competition_${id}_participant_info`;
  const participantTokenKey = `competition_${id}_participant_token`;

  const [markers, setMarkers] = useState<StoredMarker[]>([]);
  const [competition, setCompetition] = useState<CompetitionSummary | null>(null);
  const [participant, setParticipant] = useState<ParticipantSummary | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingCompetition, setIsLoadingCompetition] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingCheckout, setIsSavingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setCheckoutError(null);
    setIsSavingCheckout(true);

    try {
      const participantToken = localStorage.getItem(participantTokenKey);
      if (!participantToken) {
        throw new Error("Participant session not found. Please log in again.");
      }

      // Prepare checkout data with complete information
      const checkoutData = {
        competitionId: id,
        competition: {
          id: competition?.id,
          title: competition?.title,
          imageUrl: competition?.imageUrl,
          pricePerTicket: competition?.pricePerTicket,
          markersPerTicket: competition?.markersPerTicket,
          status: competition?.status,
        },
        participant: {
          id: participant?.id,
          name: participant?.name,
          phone: participant?.phone,
          ticketsPurchased: participant?.ticketsPurchased,
        },
        tickets: groupedMarkers.map((group) => ({
          ticketNumber: group.ticketNumber,
          markerCount: group.markers.length,
          markers: group.markers.map((m) => ({
            id: m.id,
            x: m.x,
            y: m.y,
            label: m.label,
          })),
        })),
        totalMarkers: totalMarkers,
        checkoutTime: new Date().toISOString(),
      };

      // Save to backend
      const response = await fetch(buildApiUrl(`competitions/${id}/checkout-summary`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${participantToken}`,
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save checkout data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Checkout saved successfully:', responseData);

      // Store checkout data in localStorage for immediate access
      localStorage.setItem(`competition_${id}_checkout_summary`, JSON.stringify(checkoutData));

      // Redirect to access code page
      router.push(`/competition/${id}/checkout/access-code`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to proceed with checkout';
      console.error('Error during checkout:', errorMsg);
      setCheckoutError(errorMsg);
    } finally {
      setIsSavingCheckout(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    try {
      const storedMarkers = localStorage.getItem(checkoutMarkersKey);
      if (storedMarkers) {
        const parsed = JSON.parse(storedMarkers) as StoredMarker[];
        const validMarkers = Array.isArray(parsed)
          ? parsed.filter(
              (marker): marker is StoredMarker =>
                !!marker && typeof marker === "object" &&
                typeof marker.id === "string" &&
                typeof marker.ticketId === "string" &&
                typeof marker.ticketNumber === "number" &&
                typeof marker.x === "number" &&
                typeof marker.y === "number" &&
                typeof marker.label === "string"
            )
          : [];

        if (validMarkers.length) {
          setMarkers(validMarkers);
        } else {
          setError("We couldn't find any saved markers. Please return to the placement step.");
        }
      } else {
        setError("You have no saved markers for checkout yet. Place your markers first.");
      }
    } catch (storageError) {
      console.error("Failed to read saved markers:", storageError);
      setError("We couldn't read your saved markers. Please head back and try again.");
    }

    try {
      let participantData: ParticipantSummary | null = null;
      
      // First try competition-specific participant info
      const storedParticipant = localStorage.getItem(participantInfoKey);
      if (storedParticipant) {
        const parsed = JSON.parse(storedParticipant) as ParticipantSummary;
        if (parsed && typeof parsed === "object") {
          participantData = parsed;
        }
      }
      
      // Fallback to global participant profile
      if (!participantData) {
        const profileStr = localStorage.getItem("participant_profile");
        if (profileStr) {
          const profile = JSON.parse(profileStr) as ParticipantSummary;
          if (profile && typeof profile === "object") {
            participantData = profile;
          }
        }
      }
      
      if (participantData) {
        setParticipant(participantData);
      }
    } catch (storageError) {
      console.warn("Failed to read participant info:", storageError);
    }

    setIsHydrated(true);
  }, [checkoutMarkersKey, id, participantInfoKey]);

  // Save checkout markers to backend after page loads
  useEffect(() => {
    if (!isHydrated || !participant || markers.length === 0) return;

    const saveCheckoutToBackend = async () => {
      try {
        setIsSavingCheckout(true);
        const participantToken = localStorage.getItem(participantTokenKey);

        if (!participantToken) {
          console.warn('No participant token available for saving checkout');
          return;
        }

        // Group markers by ticket
        const ticketGroups = new Map<string, StoredMarker[]>();
        markers.forEach((marker) => {
          if (!ticketGroups.has(marker.ticketId)) {
            ticketGroups.set(marker.ticketId, []);
          }
          ticketGroups.get(marker.ticketId)!.push(marker);
        });

        // Build submissions payload
        const ticketsPayload = Array.from(ticketGroups.entries()).map(([ticketId, ticketMarkers]) => ({
          ticketId,
          markers: ticketMarkers.map((m) => ({
            x: m.x,
            y: m.y,
          })),
        }));

        const response = await fetch(buildApiUrl(`competitions/${id}/entries`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${participantToken}`,
          },
          body: JSON.stringify({
            tickets: ticketsPayload,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to save checkout to backend:', errorData);
          return;
        }

        const data = await response.json();
        console.log('Checkout saved successfully to backend:', data);
      } catch (err) {
        console.error('Error saving checkout to backend:', err);
      } finally {
        setIsSavingCheckout(false);
      }
    };

    saveCheckoutToBackend();
  }, [isHydrated, participant, markers, id, participantTokenKey]);

  useEffect(() => {
    if (!id) return;

    const fetchCompetition = async () => {
      try {
        const participantToken = localStorage.getItem(participantTokenKey);
        const headers: HeadersInit = participantToken
          ? { Authorization: `Bearer ${participantToken}` }
          : {};

        const response = await fetch(buildApiUrl(`competitions/${id}`), { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load competition details");
        }

        const competitionData = data.data?.competition;
        setCompetition({
          id: competitionData.id,
          title: competitionData.title,
          imageUrl: competitionData.imageUrl,
          pricePerTicket: competitionData.pricePerTicket,
          markersPerTicket: competitionData.markersPerTicket,
          status: competitionData.status,
        });
      } catch (err) {
        console.error("Checkout competition fetch error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "We couldn't load the competition details. Please try again."
        );
      } finally {
        setIsLoadingCompetition(false);
      }
    };

    fetchCompetition();
  }, [id, participantTokenKey]);

  useEffect(() => {
    if (!isHydrated) return;
    if (error) return;

    if (!markers.length) {
      const timer = window.setTimeout(() => {
        router.replace(`/competition/${id}/enter`);
      }, 3200);

      return () => window.clearTimeout(timer);
    }
  }, [error, id, isHydrated, markers.length, router]);

  const groupedMarkers = useMemo(() => {
    const groups = new Map<string, { ticketNumber: number; markers: StoredMarker[] }>();

    markers
      .slice()
      .sort((a, b) => a.ticketNumber - b.ticketNumber || a.label.localeCompare(b.label))
      .forEach((marker) => {
        const existing = groups.get(marker.ticketId);
        if (existing) {
          existing.markers.push(marker);
        } else {
          groups.set(marker.ticketId, {
            ticketNumber: marker.ticketNumber,
            markers: [marker],
          });
        }
      });

    return Array.from(groups.values()).map((group) => ({
      ticketNumber: group.ticketNumber,
      markers: group.markers.sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [markers]);

  const totalMarkers = markers.length;

  const isLoading = !isHydrated || isLoadingCompetition;
  const hasMarkers = isHydrated && !isLoading && markers.length > 0;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-400" />
          <p className="text-sm text-slate-400">Preparing your checkout summary...</p>
        </div>
      </main>
    );
  }

  if (error || !hasMarkers) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center shadow-2xl">
          <div className="text-3xl mb-3">🧭</div>
          <h1 className="text-lg font-semibold text-white mb-2">No Markers Ready Yet</h1>
          <p className="text-sm text-slate-400">
            {error || "We couldn't find your saved markers. You'll be redirected to the placement screen."}
          </p>
          <Link
            href={`/competition/${id}/enter`}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg hover:bg-emerald-400"
          >
            Return to Placement
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-900 pb-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pt-12 lg:px-8">
          <header className="flex flex-col gap-6 rounded-3xl border border-emerald-500/20 bg-slate-900/40 p-8 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Checkout Summary</p>
                <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                  {competition?.title ?? "Competition"}
                </h1>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {competition?.status ?? "ACTIVE"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Participant</p>
                <p className="mt-2 text-lg font-medium text-white">{participant?.name ?? "Guest"}</p>
                {participant?.phone && <p className="text-sm text-slate-400">{participant.phone}</p>}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Tickets</p>
                <p className="mt-2 text-lg font-semibold text-white">{groupedMarkers.length}</p>
                <p className="text-sm text-slate-400">Populated with {totalMarkers} markers</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Markers / Ticket</p>
                <p className="mt-2 text-lg font-semibold text-white">{competition?.markersPerTicket ?? "-"}</p>
                <p className="text-sm text-slate-400">Configured requirement</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Entry Value</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  ₹{(competition?.pricePerTicket ?? 0) * groupedMarkers.length}
                </p>
                <p className="text-sm text-slate-400">Est. total value</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {checkoutError && (
                <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-sm text-red-200">{checkoutError}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSavingCheckout}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-emerald-950 shadow-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingCheckout ? "Processing..." : "Checkout"}
              </button>
            </div>
          </header>

          <section className="space-y-6 pb-6">
            <div className="sticky top-0 z-10 -mx-6 bg-slate-950/70 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
              <h2 className="text-lg font-semibold text-white">Marker Breakdown</h2>
              <p className="text-sm text-slate-400">
                Scroll to review every marker you have locked in before final confirmation.
              </p>
            </div>

            <div className="space-y-5">
              {groupedMarkers.map((group) => (
                <div
                  key={`ticket-${group.ticketNumber}`}
                  className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Ticket</p>
                      <h3 className="text-2xl font-semibold text-white">#{group.ticketNumber}</h3>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {group.markers.length} marker{group.markers.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.markers.map((marker) => (
                      <article
                        key={marker.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                      >
                        <header className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{marker.label}</span>
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                            Marker ID
                          </span>
                        </header>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">X (normalized)</dt>
                            <dd className="font-medium text-white">{formatNormalized(marker.x)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">Y (normalized)</dt>
                            <dd className="font-medium text-white">{formatNormalized(marker.y)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">X (canvas)</dt>
                            <dd className="text-emerald-200">{formatPercent(marker.x)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">Y (canvas)</dt>
                            <dd className="text-emerald-200">{formatPercent(marker.y)}</dd>
                          </div>
                        </dl>
                        <footer className="mt-auto text-xs text-slate-500">
                          Token: <span className="font-mono text-slate-400">{marker.id}</span>
                        </footer>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
