"use client";
/* eslint-disable react/no-unescaped-entities */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import CheckoutModal, { CheckoutTicket } from "@/components/CheckoutModal";
import MarkerCanvas from "@/components/MarkerCanvas";
import { buildApiUrl } from "@/lib/api";

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
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [phaseImageUrl, setPhaseImageUrl] = useState<string>('');
  const [phaseStatus, setPhaseStatus] = useState<string>('ACTIVE');

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
      
      // Determine active phase
      const phase1Status = localStorage.getItem('admin_phase1_status') || 'NOT_STARTED';
      const phase2Status = localStorage.getItem('admin_phase2_status') || 'NOT_STARTED';
      const phase3Status = localStorage.getItem('admin_phase3_status') || 'NOT_STARTED';
      
      let activePhase = 1;
      let activePhaseStatus = phase1Status;
      
      // Find the currently active phase
      if (phase3Status === 'ACTIVE') {
        activePhase = 3;
        activePhaseStatus = phase3Status;
      } else if (phase2Status === 'ACTIVE') {
        activePhase = 2;
        activePhaseStatus = phase2Status;
      } else if (phase1Status === 'ACTIVE') {
        activePhase = 1;
        activePhaseStatus = phase1Status;
      } else {
        // If no phase is active, default to phase 1
        activePhase = 1;
        activePhaseStatus = phase1Status;
      }
      
      setCurrentPhase(activePhase);
      setPhaseStatus(activePhaseStatus);
      
      // Load phase image from localStorage
      const phaseImage = localStorage.getItem(`admin_phase${activePhase}_image_url`);
      if (phaseImage) {
        setPhaseImageUrl(phaseImage);
      } else {
        // If no phase image is set, use competition image as fallback
        setPhaseImageUrl('');
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

      const response = await fetch(buildApiUrl(`competitions/${id}`), {
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
  }, [competitionTokenKey, hasAccess, id, participantToken]);

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
        buildApiUrl(`competitions/${id}/participants/me/tickets`),
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
  }, [id, participantInfoKey, participantToken, participantTokenKey]);

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
          buildApiUrl(`competitions/${id}/participants/authenticate`),
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
      const response = await fetch(buildApiUrl(`competitions/${id}/entries`), {
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

  // Main marker placement view - fullscreen only
  return (
    <>
      <main className="h-screen w-screen bg-[#00563F] flex flex-col overflow-hidden fixed inset-0">
        {/* Header with logo */}
        <div className="bg-[#00563F] text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="font-bold text-lg tracking-wider">WISHMASTERS</div>
          <div className="text-xs opacity-75">
            Phase {currentPhase} - {phaseStatus}
          </div>
        </div>

        {/* Main Canvas Area - Fullscreen Phase Image */}
        <div className="flex-1 relative bg-[#0E1C1F] overflow-hidden">

          {/* Ticket Counter - shown if tickets are available */}
          {tickets.length > 0 && (
            <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-semibold shadow-lg">
              {markers.filter(m => !m.locked).length} / {tickets.reduce((sum, t) => sum + (t.markersAllowed ?? competition.markersPerTicket), 0)}
            </div>
          )}

          {/* Phase Image Canvas - Always show if available */}
          {phaseImageUrl ? (
            <div className="absolute inset-0 flex justify-center items-start px-6 pb-6">
              <MarkerCanvas
                imageUrl={phaseImageUrl}
                tickets={tickets}
                markersPerTicket={competition.markersPerTicket}
                onMarkersChange={handleMarkersChange}
                showPanels={false}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-sm">
                <div className="text-4xl mb-3">🖼️</div>
                <h3 className="text-lg font-semibold mb-2">No Phase Image</h3>
                <p className="text-sm text-gray-600">
                  The admin hasn't uploaded an image for Phase {currentPhase} yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="bg-[#00563F] p-4 flex-shrink-0">
          {submissionMessage && (
            <div className="mb-3 bg-emerald-500 text-white text-xs rounded-lg px-3 py-2 text-center">
              {submissionMessage}
            </div>
          )}
          
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* Settings Icon */}
            <button 
              onClick={() => {
                const info = `Competition: ${competition.title}\nPhase: ${currentPhase} (${phaseStatus})\nMarkers per ticket: ${competition.markersPerTicket}`;
                alert(info);
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Grid Icon */}
            <button 
              onClick={() => {
                alert(`Competition: ${competition.title}\nPhase: ${currentPhase}\nYour Tickets: ${tickets.length}\nMarkers per ticket: ${competition.markersPerTicket}`);
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Share Icon */}
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: competition.title,
                    text: `Join ${competition.title} competition!`,
                    url: window.location.href,
                  });
                } else {
                  alert('Share this link:\n' + window.location.href);
                }
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* PLACE Button */}
          <button
            type="button"
            onClick={handleSubmitMarkers}
            disabled={!canSubmitMarkers || isSubmittingMarkers || phaseStatus !== 'ACTIVE'}
            className="w-full py-4 bg-white text-[#00563F] font-bold text-lg rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmittingMarkers ? "SUBMITTING..." : "PLACE"}
          </button>
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
