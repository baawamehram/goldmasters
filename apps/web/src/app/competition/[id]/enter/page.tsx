"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import CheckoutModal, { CheckoutTicket } from "@/components/CheckoutModal";
import MarkerCanvas from "@/components/MarkerCanvas";

interface Competition {
  id: string;
  title: string;
  imageUrl: string;
  maxEntries: number;
  ticketsSold: number;
  remainingSlots: number;
  status: string;
  pricePerTicket: number;
  markersPerTicket: number;
  endsAt: string;
}

interface ParticipantSummary {
  id: string;
  name: string;
  phone: string;
  ticketsPurchased: number;
}

interface TicketMarker {
  id: string;
  x: number;
  y: number;
}

interface Ticket {
  id: string;
  ticketNumber: number;
  status: string;
  markersAllowed: number;
  markersUsed: number;
  markers: TicketMarker[];
  submittedAt?: string | null;
}

interface MarkerPayload {
  id: string;
  ticketId: string;
  ticketNumber: number;
  x: number;
  y: number;
  label: string;
  color: string;
  locked: boolean;
}

interface ParticipantStats {
  ticketsPurchased: number;
  entriesUsed: number;
  entriesRemaining: number;
}

export default function EnterCompetitionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const competitionTokenKey = "competition_access_token";
  const participantTokenKey = `competition_${id}_participant_token`;
  const participantInfoKey = `competition_${id}_participant_info`;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantSummary | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isParticipantLoading, setIsParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantPhone, setParticipantPhone] = useState("");

  const [markers, setMarkers] = useState<MarkerPayload[]>([]);
  const [isSubmittingMarkers, setIsSubmittingMarkers] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    // Check if user has valid competition access token
    const checkAccess = () => {
      const token = localStorage.getItem('competition_access_token');
      const hasCompetitionAccess = localStorage.getItem(`competition_${id}_access`);
      
      if (!token || !hasCompetitionAccess) {
        // Redirect to gate page if no access token
        router.push(`/competition/${id}/gate`);
        return;
      }
      
      setHasAccess(true);
      setIsChecking(false);
    };
    
    checkAccess();
  }, [id, router]);

  useEffect(() => {
    if (!hasAccess) return;

    const storedToken = localStorage.getItem(participantTokenKey);
    const storedInfo = localStorage.getItem(participantInfoKey);

    if (storedToken) {
      setParticipantToken(storedToken);
    }

    if (storedInfo) {
      try {
        const parsed: ParticipantSummary = JSON.parse(storedInfo);
        setParticipant(parsed);
      } catch (parseError) {
        console.warn("Failed to parse participant info", parseError);
      }
    }
  }, [hasAccess, participantInfoKey, participantTokenKey]);

  const fetchCompetitionData = useCallback(async () => {
    if (!hasAccess) return;

    try {
      setIsLoading(true);
      const storedCompetitionToken = localStorage.getItem(competitionTokenKey);
      const authToken = participantToken ?? storedCompetitionToken;

      const headers: HeadersInit = authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {};

      const response = await fetch(`${API_URL}/api/v1/competitions/${id}`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch competition data");
      }

      setCompetition(data.data.competition);
      setError(null);
    } catch (err) {
      console.error("Error fetching competition:", err);
      setError(err instanceof Error ? err.message : "Failed to load competition");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, competitionTokenKey, hasAccess, id, participantToken]);

  useEffect(() => {
    if (!hasAccess) return;
    fetchCompetitionData();
  }, [fetchCompetitionData, hasAccess]);

  const fetchParticipantTickets = useCallback(async () => {
    if (!participantToken) {
      setTickets([]);
      return;
    }

    try {
      setIsParticipantLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/competitions/${id}/participants/me/tickets`,
        {
          headers: {
            Authorization: `Bearer ${participantToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch participant tickets");
      }

      const participantData = data.data.participant as ParticipantSummary;
      const ticketData = (data.data.tickets as Ticket[]) || [];

      setParticipant({
        id: participantData.id,
        name: participantData.name,
        phone: participantData.phone,
        ticketsPurchased: participantData.ticketsPurchased,
      });
      setTickets(
        ticketData.map((ticket) => ({
          ...ticket,
          markers: ticket.markers ?? [],
          submittedAt: ticket.submittedAt ?? null,
        }))
      );
      localStorage.setItem(participantTokenKey, participantToken);
      localStorage.setItem(
        participantInfoKey,
        JSON.stringify({
          id: participantData.id,
          name: participantData.name,
          phone: participantData.phone,
          ticketsPurchased: participantData.ticketsPurchased,
        })
      );
      setParticipantError(null);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setParticipantError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setIsParticipantLoading(false);
    }
  }, [API_URL, id, participantInfoKey, participantToken, participantTokenKey]);

  useEffect(() => {
    if (!participantToken) {
      setTickets([]);
      return;
    }

    fetchParticipantTickets();
  }, [fetchParticipantTickets, participantToken]);

  const participantStats = useMemo<ParticipantStats | null>(() => {
    if (!participant || !competition) {
      return null;
    }

    if (!tickets.length) {
      return {
        ticketsPurchased: participant.ticketsPurchased,
        entriesUsed: 0,
        entriesRemaining: participant.ticketsPurchased * competition.markersPerTicket,
      };
    }

    const totalAllowed = tickets.reduce(
      (sum, ticket) => sum + (ticket.markersAllowed ?? competition.markersPerTicket),
      0
    );
    const totalUsed = tickets.reduce((sum, ticket) => sum + (ticket.markersUsed ?? 0), 0);

    return {
      ticketsPurchased: tickets.length,
      entriesUsed: totalUsed,
      entriesRemaining: Math.max(0, totalAllowed - totalUsed),
    };
  }, [competition, participant, tickets]);

  const hasActiveTickets = useMemo(
    () => tickets.some((ticket) => ticket.status === "ASSIGNED"),
    [tickets]
  );

  const canSubmitMarkers = useMemo(() => {
    if (!participantToken) {
      return false;
    }

    const activeTickets = tickets.filter((ticket) => ticket.status === "ASSIGNED");
    if (!activeTickets.length) {
      return false;
    }

    return activeTickets.every((ticket) => {
      const required = ticket.markersAllowed ?? competition?.markersPerTicket ?? 0;
      if (required === 0) {
        return false;
      }

      const ticketMarkers = markers.filter(
        (marker) => marker.ticketId === ticket.id && !marker.locked
      );

      return ticketMarkers.length === required;
    });
  }, [competition?.markersPerTicket, markers, participantToken, tickets]);

  const checkoutReadyMarkers = useMemo(
    () => markers.filter((marker) => !marker.locked),
    [markers]
  );

  const handleMarkersChange = useCallback((updatedMarkers: MarkerPayload[]) => {
    setMarkers(updatedMarkers);
  }, []);

  const handleParticipantAuth = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setParticipantError(null);
      setSubmissionMessage(null);

      if (!participantName.trim() || !participantPhone.trim()) {
        setParticipantError("Please provide both name and phone number.");
        return;
      }

      try {
        setIsParticipantLoading(true);
        const response = await fetch(
          `${API_URL}/api/v1/competitions/${id}/participants/authenticate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: participantName.trim(),
              phone: participantPhone.trim(),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Participant verification failed");
        }

        const participantData = data.data.participant as ParticipantSummary;
        const participantAccessToken = data.data.participantAccessToken as string;
        const ticketData = (data.data.tickets as Ticket[]) || [];

        setParticipant({
          id: participantData.id,
          name: participantData.name,
          phone: participantData.phone,
          ticketsPurchased: participantData.ticketsPurchased,
        });
        setParticipantToken(participantAccessToken);
        setTickets(
          ticketData.map((ticket) => ({
            ...ticket,
            markers: ticket.markers ?? [],
            submittedAt: ticket.submittedAt ?? null,
          }))
        );
        localStorage.setItem(participantTokenKey, participantAccessToken);
        localStorage.setItem(
          participantInfoKey,
          JSON.stringify({
            id: participantData.id,
            name: participantData.name,
            phone: participantData.phone,
            ticketsPurchased: participantData.ticketsPurchased,
          })
        );
        setParticipantName("");
        setParticipantPhone("");
        setSubmissionMessage("Participant verified. You can now place your markers.");
        await fetchCompetitionData();
      } catch (err) {
        console.error("Participant authentication error:", err);
        setParticipantError(err instanceof Error ? err.message : "Failed to verify participant");
      } finally {
        setIsParticipantLoading(false);
      }
    },
    [
      API_URL,
      fetchCompetitionData,
      id,
      participantInfoKey,
      participantName,
      participantPhone,
      participantTokenKey,
    ]
  );

  const handleParticipantLogout = useCallback(() => {
    setParticipantToken(null);
    setParticipant(null);
    setTickets([]);
    setMarkers([]);
    setSubmissionMessage(null);
    setParticipantError(null);
    localStorage.removeItem(participantTokenKey);
    localStorage.removeItem(participantInfoKey);
  }, [participantInfoKey, participantTokenKey]);

  const handleSubmitMarkers = useCallback(async () => {
    if (!participantToken) {
      setParticipantError("Verify participant details before submitting markers.");
      return;
    }

    const activeTickets = tickets.filter((ticket) => ticket.status === "ASSIGNED");
    if (!activeTickets.length) {
      setSubmissionMessage("All tickets have already been submitted.");
      return;
    }

    const ticketPayload: { ticketId: string; markers: { x: number; y: number }[] }[] = [];

    for (const ticket of activeTickets) {
      const markersForTicket = markers
        .filter((marker) => marker.ticketId === ticket.id && !marker.locked)
        .map((marker) => ({
          x: Number(marker.x.toFixed(4)),
          y: Number(marker.y.toFixed(4)),
        }));

      const requiredMarkers = ticket.markersAllowed ?? competition?.markersPerTicket ?? 0;

      if (markersForTicket.length !== requiredMarkers) {
        setParticipantError(
          `Ticket ${ticket.ticketNumber} requires exactly ${requiredMarkers} markers.`
        );
        return;
      }

      ticketPayload.push({
        ticketId: ticket.id,
        markers: markersForTicket,
      });
    }

    try {
      setIsSubmittingMarkers(true);
      setParticipantError(null);
      const response = await fetch(`${API_URL}/api/v1/competitions/${id}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${participantToken}`,
        },
        body: JSON.stringify({ tickets: ticketPayload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit markers");
      }

      const updatedTickets = (data.data.tickets as Ticket[]) || [];
      setTickets(
        updatedTickets.map((ticket) => ({
          ...ticket,
          markers: ticket.markers ?? [],
          submittedAt: ticket.submittedAt ?? null,
        }))
      );

      if (data.data.participant) {
        const updatedParticipant = data.data.participant as ParticipantSummary;
        setParticipant({
          id: updatedParticipant.id,
          name: updatedParticipant.name,
          phone: updatedParticipant.phone,
          ticketsPurchased: updatedParticipant.ticketsPurchased,
        });
        localStorage.setItem(
          participantInfoKey,
          JSON.stringify({
            id: updatedParticipant.id,
            name: updatedParticipant.name,
            phone: updatedParticipant.phone,
            ticketsPurchased: updatedParticipant.ticketsPurchased,
          })
        );
      }

      setSubmissionMessage("Markers submitted successfully! Your tickets are now locked.");
      await fetchCompetitionData();
    } catch (err) {
      console.error("Marker submission error:", err);
      setParticipantError(err instanceof Error ? err.message : "Could not submit markers");
    } finally {
      setIsSubmittingMarkers(false);
    }
  }, [
    API_URL,
    competition?.markersPerTicket,
    fetchCompetitionData,
    id,
    markers,
    participantInfoKey,
    participantToken,
    tickets,
  ]);

  const handleOpenCheckout = useCallback(() => {
    if (checkoutReadyMarkers.length === 0) {
      setParticipantError("Place fresh markers before opening checkout.");
      return;
    }

    setParticipantError(null);
    setIsCheckoutModalOpen(true);
  }, [checkoutReadyMarkers]);

  const handleCheckoutSuccess = useCallback(
    async (result: { participantId?: string; tickets?: CheckoutTicket[] }) => {
      setIsCheckoutModalOpen(false);
      setParticipantError(null);
      setSubmissionMessage(
        result.participantId
          ? `Checkout complete. Your participant ID is ${result.participantId}. Keep it handy for any queries.`
          : "Checkout complete. Your markers have been recorded."
      );
      if (result.tickets) {
        setTickets(
          result.tickets.map((ticket) => ({
            ...ticket,
            markers: (ticket.markers ?? []).map((marker) => ({
              id: marker.id,
              x: marker.x,
              y: marker.y,
            })),
            markersAllowed: ticket.markersAllowed ?? competition?.markersPerTicket ?? 0,
            markersUsed: ticket.markersUsed ?? ticket.markers?.length ?? 0,
            submittedAt: ticket.submittedAt ?? null,
          }))
        );
      }
      await fetchCompetitionData();
    },
    [competition?.markersPerTicket, fetchCompetitionData]
  );

  if (isChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </main>
    );
  }

  if (!hasAccess) {
    return null; // Router will redirect
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading competition...</p>
        </div>
      </main>
    );
  }

  if (error || !competition) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-modal p-6 sm:p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Error Loading Competition</h1>
            <p className="text-muted-foreground mb-4">{error || 'Competition not found'}</p>
            <button
              onClick={() => router.push('/competitions')}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
            >
              Back to Competitions
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5 py-8 px-4">
        <div className="container-custom max-w-6xl space-y-6">
        <div className="bg-card rounded-2xl shadow-modal p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading">{competition.title}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Use your assigned tickets to place markers on the image. Submissions cannot be edited once locked.
              </p>
            </div>
            {participant && (
              <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                Signed in as <span className="font-medium text-foreground">{participant.name}</span>
                <span className="mx-1">•</span>
                {participant.phone}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Tickets Sold</p>
              <p className="text-lg font-bold">{competition.ticketsSold}/{competition.maxEntries}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Remaining Slots</p>
              <p className="text-lg font-bold">{competition.remainingSlots}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Price per Ticket</p>
              <p className="text-lg font-bold">₹{competition.pricePerTicket}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Markers/Ticket</p>
              <p className="text-lg font-bold">{competition.markersPerTicket}</p>
            </div>
          </div>

          {participantStats ? (
            <div className="mt-6 p-4 bg-brand-primary/10 border-l-4 border-brand-primary/70 rounded-lg">
              <h3 className="font-semibold mb-2 text-brand-primary">Your Entry Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tickets assigned</p>
                  <p className="font-bold text-lg">{participantStats.ticketsPurchased}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Markers submitted</p>
                  <p className="font-bold text-lg">{participantStats.entriesUsed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Markers remaining</p>
                  <p className="font-bold text-lg text-brand-primary">
                    {participantStats.entriesRemaining}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              Verify your participant details below to load ticket assignments and marker quotas.
            </div>
          )}
        </div>

        {participantError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            {participantError}
          </div>
        )}

        {submissionMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-4 py-3">
            {submissionMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="space-y-4">
            <div className="bg-card rounded-2xl shadow-modal p-6">
              <h2 className="text-lg font-semibold mb-4">Participant Access</h2>
              {participant ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    You're verified as <span className="font-medium text-foreground">{participant.name}</span>.
                    Your ticket data stays cached on this device.
                  </p>
                  <button
                    type="button"
                    onClick={handleParticipantLogout}
                    className="w-full px-4 py-2 rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-primary/5 transition-all"
                    disabled={isParticipantLoading || isSubmittingMarkers}
                  >
                    Switch participant
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Participant sessions remain active for 24 hours. Switch users if this isn't you.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleParticipantAuth} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="participant-name" className="text-xs font-medium text-muted-foreground uppercase">
                      Participant name
                    </label>
                    <input
                      id="participant-name"
                      type="text"
                      required
                      value={participantName}
                      onChange={(event) => setParticipantName(event.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="participant-phone" className="text-xs font-medium text-muted-foreground uppercase">
                      Phone number
                    </label>
                    <input
                      id="participant-phone"
                      type="tel"
                      required
                      value={participantPhone}
                      onChange={(event) => setParticipantPhone(event.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isParticipantLoading}
                    className="w-full px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isParticipantLoading ? "Verifying..." : "Verify & load tickets"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    We'll match your details with the organiser's ticket list. Reach out to support if you're unable to sign in.
                  </p>
                </form>
              )}
            </div>

            <div className="bg-card rounded-2xl shadow-modal p-6">
              <h2 className="text-lg font-semibold mb-4">Assigned Tickets</h2>
              {isParticipantLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-3 w-3 rounded-full border-2 border-t-transparent border-brand-primary animate-spin" />
                  <span>Loading tickets...</span>
                </div>
              ) : tickets.length ? (
                <ul className="space-y-3 text-sm">
                  {tickets.map((ticket) => {
                    const isLocked = ticket.status !== "ASSIGNED";
                    const markersAllowed = ticket.markersAllowed ?? competition.markersPerTicket;
                    const markersUsed = ticket.markersUsed ?? ticket.markers?.length ?? 0;

                    return (
                      <li key={ticket.id} className="p-4 rounded-xl bg-muted">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>Ticket #{ticket.ticketNumber}</span>
                          <span className={isLocked ? "text-red-500" : "text-green-600"}>
                            {isLocked ? "Submitted" : "Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Markers: {markersUsed} / {markersAllowed}
                        </p>
                        {ticket.submittedAt && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Submitted {new Date(ticket.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {participant
                    ? "No tickets assigned yet. Contact the competition admin if this seems incorrect."
                    : "Verify your participant details to load assigned tickets."
                  }
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-2xl shadow-modal p-6 space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-bold font-heading">Place Your Markers</h2>
                {participantStats && (
                  <div className="text-xs text-muted-foreground">
                    Entries remaining: <span className="font-semibold text-brand-primary">{participantStats.entriesRemaining}</span>
                  </div>
                )}
              </div>

              {tickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-muted-foreground/40 bg-muted/50 p-6 text-sm text-muted-foreground">
                  {participant
                    ? "No tickets are available to place markers. Please reach out to the organiser."
                    : "Verify your participant access to start placing markers."
                  }
                </div>
              ) : (
                <>
                  <MarkerCanvas
                    imageUrl={competition.imageUrl}
                    tickets={tickets}
                    markersPerTicket={competition.markersPerTicket}
                    onMarkersChange={handleMarkersChange}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-sm font-semibold mb-2">Markers Overview</h3>
                      {markers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Drag the colored markers onto the competition image to place your guesses.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-xs">
                          {markers.map((marker) => (
                            <li
                              key={marker.id}
                              className="flex items-center justify-between bg-background rounded-md px-3 py-2"
                            >
                              <span className="font-medium">{marker.label}</span>
                              <span className="text-muted-foreground">
                                ({marker.x.toFixed(3)}, {marker.y.toFixed(3)})
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <h3 className="text-sm font-semibold">Submit Entry</h3>
                      {hasActiveTickets ? (
                        <p className="text-xs text-muted-foreground">
                          Make sure every ticket has the required number of markers before submitting. Once submitted, markers cannot be adjusted.
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 font-medium">
                          All assigned tickets are already locked in. You're good to go!
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleSubmitMarkers}
                        disabled={!canSubmitMarkers || isSubmittingMarkers}
                        className="w-full btn-touch px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmittingMarkers ? "Submitting..." : "Submit markers"}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCheckout}
                        disabled={isSubmittingMarkers || checkoutReadyMarkers.length === 0}
                        className="w-full btn-touch px-4 py-2 rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-primary/5 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Checkout with organiser password
                      </button>
                      {!canSubmitMarkers && hasActiveTickets && (
                        <p className="text-[11px] text-yellow-800 bg-yellow-100/80 border border-yellow-200 rounded-md px-3 py-2">
                          Add the required marker count for each active ticket before submitting.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        competitionId={id}
        markers={markers}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </>
  );
}
