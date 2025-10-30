"use client";
/* eslint-disable react/no-unescaped-entities */

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import MarkerCanvas, { MarkerCanvasHandle } from "@/components/MarkerCanvas";
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
  isVisible?: boolean;
  state?: "placed" | "active" | "pending";
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
  const checkoutMarkersKey = `competition_${id}_checkout_markers`;

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
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [phaseImageUrl, setPhaseImageUrl] = useState<string>('');
  const [phaseStatus, setPhaseStatus] = useState<string>('ACTIVE');

  const markerCanvasRef = useRef<MarkerCanvasHandle | null>(null);

  const persistParticipantSession = useCallback(
    (participantData: ParticipantSummary, participantAccessToken: string, ticketData: Ticket[]) => {
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
      localStorage.removeItem(checkoutMarkersKey);
      setParticipantError(null);
    },
    [checkoutMarkersKey, participantInfoKey, participantTokenKey]
  );

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
      if (participantToken !== storedToken) {
        console.log('[Enter Page] Restoring stored participant token');
        setParticipantToken(storedToken);
      }
    } else if (!participantToken) {
      console.log('[Enter Page] No participant token, attempting auto-authentication');
      const competitionUser = localStorage.getItem('competition_user');

      if (competitionUser) {
        try {
          const user = JSON.parse(competitionUser);
          console.log('[Enter Page] Auto-authenticating user:', user.name);

          const authenticate = async () => {
            try {
              const response = await fetch(buildApiUrl(`competitions/${id}/participants/authenticate`), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: user.name,
                  phone: user.phone,
                }),
              });

              const data = await response.json();
              console.log('[Enter Page] Authentication response:', data);

              if (
                response.ok &&
                data.status === 'success' &&
                data.data?.participant &&
                data.data?.participantAccessToken
              ) {
                const participantData = data.data.participant as ParticipantSummary;
                const participantAccessToken = data.data.participantAccessToken as string;
                const ticketData = (data.data.tickets as Ticket[]) || [];

                console.log('[Enter Page] Auto-authentication successful, tickets:', ticketData.length);
                persistParticipantSession(participantData, participantAccessToken, ticketData);
              } else {
                console.error('[Enter Page] Auto-authentication failed:', data.message || 'Unknown error');
              }
            } catch (err) {
              console.error('[Enter Page] Auto-authentication error:', err);
            }
          };

          void authenticate();
        } catch (e) {
          console.error('[Enter Page] Failed to parse competition_user:', e);
        }
      }
    }

    if (storedInfo) {
      try {
        const parsed: ParticipantSummary = JSON.parse(storedInfo);
        setParticipant(parsed);
      } catch (parseError) {
        console.warn('Failed to parse participant info', parseError);
      }
    }
  }, [hasAccess, id, participantInfoKey, participantToken, participantTokenKey, persistParticipantSession]);

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
    const activeToken = participantToken;
    if (!activeToken) {
      setTickets([]);
      return;
    }

    try {
      setIsParticipantLoading(true);
      const response = await fetch(
        buildApiUrl(`competitions/${id}/participants/me/tickets`),
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 404 &&
          typeof data.message === "string" &&
          data.message.toLowerCase().includes("participant record not found")
        ) {
          console.warn("Participant token is no longer valid, clearing local session");
          setParticipant(null);
          setParticipantToken(null);
          setTickets([]);
          localStorage.removeItem(participantTokenKey);
          localStorage.removeItem(participantInfoKey);
          setParticipantError("We couldn't find your participant record. Please verify your details again.");
          return;
        }

        throw new Error(data.message || "Failed to fetch participant tickets");
      }

      const participantData = data.data.participant as ParticipantSummary;
      const ticketData = (data.data.tickets as Ticket[]) || [];
      persistParticipantSession(participantData, activeToken, ticketData);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setParticipantError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setIsParticipantLoading(false);
    }
  }, [id, participantInfoKey, participantToken, participantTokenKey, persistParticipantSession]);

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

  const placementSummary = useMemo(() => {
    if (!markers.length) {
      return {
        activeMarker: null as MarkerPayload | null,
        placedCount: 0,
        pendingCount: 0,
        totalCount: 0,
      };
    }

    let activeMarker: MarkerPayload | null = null;
    let placedCount = 0;
    let pendingCount = 0;

    markers.forEach((marker) => {
      const inferredState = marker.state ?? (marker.locked ? "placed" : "active");
      if (inferredState === "placed") {
        placedCount += 1;
      } else if (inferredState === "pending") {
        pendingCount += 1;
      } else if (inferredState === "active" && !activeMarker) {
        activeMarker = marker;
      } else if (inferredState === "active" && activeMarker) {
        pendingCount += 1;
      }
    });

    const totalCount = placedCount + pendingCount + (activeMarker ? 1 : 0);

    return { activeMarker, placedCount, pendingCount, totalCount };
  }, [markers]);

  const allMarkersPlaced = placementSummary.totalCount > 0 && !placementSummary.activeMarker && placementSummary.pendingCount === 0;
  const canPlaceMarker = Boolean(placementSummary.activeMarker) && phaseStatus === "ACTIVE";

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

        persistParticipantSession(participantData, participantAccessToken, ticketData);
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
    [fetchCompetitionData, id, participantName, participantPhone, persistParticipantSession]
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
    localStorage.removeItem(checkoutMarkersKey);
  }, [checkoutMarkersKey, participantInfoKey, participantTokenKey]);
  const handlePlaceMarker = useCallback(() => {
    setParticipantError(null);

    const canvasHandle = markerCanvasRef.current;
    if (!canvasHandle) {
      setParticipantError("Canvas is still loading. Please try again in a moment.");
      return;
    }

    const activeMarker = canvasHandle.getActiveMarker();
    if (!activeMarker) {
      setParticipantError("No marker available to place right now.");
      return;
    }

    const { placed, hasMore } = canvasHandle.placeCurrentMarker();
    if (!placed) {
      setParticipantError("We couldn't lock that marker. Adjust it and try again.");
      return;
    }

    setSubmissionMessage(
      hasMore
        ? `${activeMarker.label} locked. The next marker is ready.`
        : "Brilliant! All markers are placed. Proceed to checkout to confirm."
    );
  }, []);

  const handleCheckout = useCallback(() => {
    setParticipantError(null);

    if (!participantToken) {
      setParticipantError("Verify your participant details before checking out.");
      return;
    }

    if (!allMarkersPlaced) {
      setParticipantError("Place all of your markers before proceeding to checkout.");
      return;
    }

    const placedMarkers = markers.filter((marker) => {
      const inferredState = marker.state ?? (marker.locked ? "placed" : "active");
      return inferredState === "placed";
    });

    localStorage.setItem(
      checkoutMarkersKey,
      JSON.stringify(
        placedMarkers.map((marker) => ({
          id: marker.id,
          ticketId: marker.ticketId,
          ticketNumber: marker.ticketNumber,
          x: Number(marker.x.toFixed(4)),
          y: Number(marker.y.toFixed(4)),
          label: marker.label,
        }))
      )
    );

    router.push(`/competition/${id}/checkout`);
  }, [allMarkersPlaced, checkoutMarkersKey, id, markers, participantToken, router]);

  const handleUndo = useCallback(() => {
    setParticipantError(null);
    const canvasHandle = markerCanvasRef.current;
    if (!canvasHandle || typeof canvasHandle.undoLastPlacement !== 'function') return;
    const undone = canvasHandle.undoLastPlacement();
    if (undone) {
      setSubmissionMessage('Last marker unlocked. Adjust and place again.');
    }
  }, []);

  // Auto-dismiss the placement toast after a short delay so it feels professional
  useEffect(() => {
    if (!submissionMessage) return;
    const timer = setTimeout(() => setSubmissionMessage(null), 1600); // ~1.6s
    return () => clearTimeout(timer);
  }, [submissionMessage]);

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
          <div className="font-bold text-lg tracking-wider">GOLDMASTERS</div>
          <div className="text-xs opacity-75">
            Phase {currentPhase} - {phaseStatus}
          </div>
        </div>

        {/* Main Canvas Area - Fullscreen Phase Image */}
  <div className="flex-1 relative bg-[#0E1C1F] overflow-hidden">

          {/* Ticket Counter - shown if tickets are available */}
          {placementSummary.totalCount > 0 && (
            <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-semibold shadow-lg">
              {placementSummary.placedCount} / {placementSummary.totalCount}
            </div>
          )}

          {/* Phase Image Canvas - Always show if available */}
          {phaseImageUrl ? (
            <div className="absolute inset-0 flex justify-center items-start px-6 pb-6">
              <MarkerCanvas
                ref={markerCanvasRef}
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

          {/* Toast was moved to bottom control bar to avoid covering the image */}
        </div>

        {/* Bottom Control Bar */}
        <div className="relative bg-[#00563F] p-4 flex-shrink-0">
          {/* Professional toast inside the control bar (no layout shift, not on image) */}
          {submissionMessage && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 z-30"
            >
              <div className="flex items-center gap-2 rounded-full bg-emerald-600/95 text-white px-4 py-2 shadow-xl border border-white/10 backdrop-blur-sm text-xs font-medium">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20">✓</span>
                <span>{submissionMessage}</span>
              </div>
            </div>
          )}
          {/* Controls remain stable height; feedback shown as floating toast above */}
          
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* Undo button (replaces settings) */}
            <button
              onClick={handleUndo}
              disabled={placementSummary.placedCount === 0}
              className="w-10 h-10 flex items-center justify-center rounded-lg transition-all bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Undo last placement"
              title={placementSummary.placedCount === 0 ? 'Nothing to undo' : 'Undo last placement'}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {/* Curved undo arrow (uturn-left style) */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 15.75l-4.5-4.5 4.5-4.5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11.25h10.5a4.5 4.5 0 010 9H12" />
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

            {/* Zoom controls (replace share) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const h = markerCanvasRef.current;
                  if (h && typeof h.zoomOut === 'function') h.zoomOut();
                }}
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const h = markerCanvasRef.current;
                  if (h && typeof h.zoomIn === 'function') h.zoomIn();
                }}
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>

          {placementSummary.totalCount > 0 && (
            <div className="text-xs text-white/80 text-center mb-2">
              {allMarkersPlaced
                ? `All ${placementSummary.totalCount} markers locked.`
                : `Marker ${placementSummary.placedCount + 1} of ${placementSummary.totalCount}`}
            </div>
          )}

          <button
            type="button"
            onClick={allMarkersPlaced ? handleCheckout : handlePlaceMarker}
            disabled={allMarkersPlaced ? false : !canPlaceMarker}
            className="w-full py-4 bg-white text-[#00563F] font-bold text-lg rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {allMarkersPlaced
              ? "CHECKOUT"
              : placementSummary.activeMarker
              ? `PLACE ${placementSummary.activeMarker.label}`
              : "PLACE"}
          </button>
        </div>
      </main>
    </>
  );
}
