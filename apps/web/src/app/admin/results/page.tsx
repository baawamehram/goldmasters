"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type PhaseId = 1 | 2 | 3;
type PhaseStatus = "NOT_STARTED" | "ACTIVE" | "CLOSED";

type BackendWinner = {
  ticketId: string;
  ticketNumber: number;
  participantId: string;
  userId?: string | null;
  participantName: string;
  participantPhone: string;
  distance: number | null;
  marker: { id: string; x: number; y: number } | null;
};

type WinnerForm = {
  name: string;
  ticketNumber: string;
  userId: string;
  phone: string;
  distance: string;
  marker: string;
};

type PhaseState = {
  published: boolean;
  winners: WinnerForm[];
  notes: string;
  lastUpdated: string | null;
};

type PhaseFeedback = {
  type: "success" | "error";
  text: string;
};

type AdminParticipantRecord = {
  id: string;
  participantId?: string;
  competitionId?: string;
  name?: string;
};

type ParticipantScanResult = {
  userId: string;
  participantId: string;
  checkoutLoaded: boolean;
  submissionLoaded: boolean;
  checkoutTicketCount: number;
  checkoutMarkerCount: number;
  submissionTicketCount: number;
  submissionMarkerCount: number;
  errors: string[];
};

type ParticipantScanReport = {
  processed: number;
  withCheckout: number;
  withSubmissions: number;
  totalMarkers: number;
  startedAt: string;
  completedAt: string;
  results: ParticipantScanResult[];
};

type CompetitionSummary = {
  id: string;
  title: string;
  status: "ACTIVE" | "CLOSED" | string;
  markersPerTicket: number;
  maxEntries: number;
  ticketsSold: number;
  finalJudgeX: number | null;
  finalJudgeY: number | null;
};

const DEFAULT_COMPETITION_ID = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID?.trim() || "test-id";
const DEFAULT_COMPETITION_TITLE = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_TITLE?.trim() || "Gold Coin";

const createCompetitionSummary = (overrides?: Partial<CompetitionSummary>): CompetitionSummary => ({
  id: DEFAULT_COMPETITION_ID,
  title: DEFAULT_COMPETITION_TITLE,
  status: "ACTIVE",
  markersPerTicket: 3,
  maxEntries: 100,
  ticketsSold: 0,
  finalJudgeX: null,
  finalJudgeY: null,
  ...overrides,
});

const PHASES: Array<{ id: PhaseId; name: string; accent: string; badge: string }> = [
  { id: 1, name: "Phase 1", accent: "from-green-50 via-white to-green-100", badge: "bg-green-100 text-green-700" },
  { id: 2, name: "Phase 2", accent: "from-blue-50 via-white to-blue-100", badge: "bg-blue-100 text-blue-700" },
  { id: 3, name: "Phase 3", accent: "from-purple-50 via-white to-purple-100", badge: "bg-purple-100 text-purple-700" },
];

const EMPTY_WINNER = (): WinnerForm => ({
  name: "",
  ticketNumber: "",
  userId: "",
  phone: "",
  distance: "",
  marker: "",
});

const DEFAULT_PHASE_STATE = (): PhaseState => ({
  published: false,
  winners: [EMPTY_WINNER(), EMPTY_WINNER(), EMPTY_WINNER()],
  notes: "",
  lastUpdated: null,
});

const phaseStorageKey = (phase: PhaseId) => `admin_phase${phase}_result_declaration`;
const phaseStatusKey = (phase: PhaseId) => `admin_phase${phase}_status`;

export default function AdminResultsPage() {
  const router = useRouter();
  const [competition, setCompetition] = useState<CompetitionSummary>(createCompetitionSummary());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Final judge coordinate inputs (shared for all phases since they belong to the competition)
  const [finalJudgeX, setFinalJudgeX] = useState<string>("");
  const [finalJudgeY, setFinalJudgeY] = useState<string>("");
  const [phaseStates, setPhaseStates] = useState<Record<PhaseId, PhaseState>>({
    1: DEFAULT_PHASE_STATE(),
    2: DEFAULT_PHASE_STATE(),
    3: DEFAULT_PHASE_STATE(),
  });
  const [phaseStatuses, setPhaseStatuses] = useState<Record<PhaseId, PhaseStatus>>({
    1: "NOT_STARTED",
    2: "NOT_STARTED",
    3: "NOT_STARTED",
  });
  const [phaseFeedback, setPhaseFeedback] = useState<Record<PhaseId, PhaseFeedback | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [phaseBusy, setPhaseBusy] = useState<Record<PhaseId, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [phaseScanReports, setPhaseScanReports] = useState<Record<PhaseId, ParticipantScanReport | null>>({
    1: null,
    2: null,
    3: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadLocalStates = () => {
      setPhaseStates((prev) => {
        const next = { ...prev };
        PHASES.forEach(({ id }) => {
          const raw = localStorage.getItem(phaseStorageKey(id));
          if (!raw) {
            return;
          }
          try {
            const parsed = JSON.parse(raw) as Partial<PhaseState>;
            next[id] = normalizePhaseState(parsed);
          } catch (error) {
            console.warn("Failed to parse stored phase result", error);
            next[id] = DEFAULT_PHASE_STATE();
          }
        });
        return next;
      });
    };

    const loadStatuses = () => {
      setPhaseStatuses((prev) => {
        const next = { ...prev };
        PHASES.forEach(({ id }) => {
          const value = localStorage.getItem(phaseStatusKey(id));
          if (value === "ACTIVE" || value === "CLOSED" || value === "NOT_STARTED") {
            next[id] = value;
          }
        });
        return next;
      });
    };

    const hydrateCompetition = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const payload = await fetchCompetitionResults(token, DEFAULT_COMPETITION_ID);
        const summary = payload.competition
          ? createCompetitionSummary(payload.competition)
          : createCompetitionSummary();
        setCompetition(summary);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load competition details";
        setLoadError(message);
        setCompetition(createCompetitionSummary());
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalStates();
    loadStatuses();
    void hydrateCompetition();
  }, [router]);

  // Keep the coordinate inputs in sync with the competition summary
  useEffect(() => {
    setFinalJudgeX(
      typeof competition.finalJudgeX === "number" && Number.isFinite(competition.finalJudgeX)
        ? competition.finalJudgeX.toFixed(3)
        : ""
    );
    setFinalJudgeY(
      typeof competition.finalJudgeY === "number" && Number.isFinite(competition.finalJudgeY)
        ? competition.finalJudgeY.toFixed(3)
        : ""
    );
  }, [competition.finalJudgeX, competition.finalJudgeY]);

  const formatTimestamp = (value: string | null) => {
    if (!value) {
      return "Never saved";
    }
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const persistPhaseState = (phase: PhaseId, state: PhaseState) => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(phaseStorageKey(phase), JSON.stringify(state));
  };

  const setPhaseState = (phase: PhaseId, updater: (current: PhaseState) => PhaseState) => {
    setPhaseStates((prev) => {
      const updated = updater(prev[phase]);
      const next = { ...prev, [phase]: updated };
      persistPhaseState(phase, updated);
      return next;
    });
  };

  const extractErrorMessage = async (response: Response) => {
    try {
      const jsonPayload = await response.clone().json();
      if (jsonPayload) {
        if (typeof jsonPayload === "string") {
          return jsonPayload;
        }
        if (typeof jsonPayload === "object") {
          return jsonPayload.message || jsonPayload.error || JSON.stringify(jsonPayload);
        }
      }
    } catch {
      // Ignore parsing errors, attempt plain text next.
    }

    try {
      const textPayload = await response.clone().text();
      if (textPayload) {
        return textPayload;
      }
    } catch {
      // Ignore and fall back to status text below.
    }

    return `${response.status} ${response.statusText}`;
  };

  const scanCompetitionEntries = async (
    token: string,
    competitionId: string
  ): Promise<ParticipantScanReport> => {
    const startedAt = new Date();

    const participantsResponse = await fetch(buildApiUrl("admin/participants"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!participantsResponse.ok) {
      throw new Error(await extractErrorMessage(participantsResponse));
    }

    const participantsPayload = await participantsResponse.json();
    const participantsList: AdminParticipantRecord[] = Array.isArray(participantsPayload.data)
      ? participantsPayload.data
      : [];

    const relevantParticipants = participantsList.filter((record) =>
      (record.competitionId ?? DEFAULT_COMPETITION_ID) === competitionId
    );

    const results: ParticipantScanResult[] = [];
    let withCheckout = 0;
    let withSubmissions = 0;
    let totalMarkers = 0;

    for (const record of relevantParticipants) {
      const participantId = record.participantId ?? record.id;
      const entry: ParticipantScanResult = {
        userId: record.id,
        participantId,
        checkoutLoaded: false,
        submissionLoaded: false,
        checkoutTicketCount: 0,
        checkoutMarkerCount: 0,
        submissionTicketCount: 0,
        submissionMarkerCount: 0,
        errors: [],
      };

      try {
        const summaryResponse = await fetch(
          buildApiUrl(`competitions/${competitionId}/checkout-summary/${participantId}`),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (summaryResponse.ok) {
          const summaryPayload = await summaryResponse.json();
          const summary = summaryPayload.summary ?? summaryPayload.data;
          if (summary) {
            entry.checkoutLoaded = true;
            const tickets = Array.isArray(summary.tickets) ? summary.tickets : [];
            entry.checkoutTicketCount = tickets.length;
            entry.checkoutMarkerCount = tickets.reduce((sum: number, ticket: unknown) => {
              if (ticket && typeof ticket === "object") {
                const ticketRecord = ticket as { markerCount?: unknown; markers?: unknown };
                if (typeof ticketRecord.markerCount === "number") {
                  return sum + ticketRecord.markerCount;
                }
                if (Array.isArray(ticketRecord.markers)) {
                  return sum + ticketRecord.markers.length;
                }
              }
              return sum;
            }, 0);
          }
        } else if (summaryResponse.status !== 404) {
          entry.errors.push(await extractErrorMessage(summaryResponse));
        }
      } catch (error) {
        entry.errors.push(
          error instanceof Error ? error.message : "Failed to load checkout summary."
        );
      }

      try {
        const submissionsResponse = await fetch(
          buildApiUrl(`admin/competitions/${competitionId}/participants/${participantId}/submissions`),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (submissionsResponse.ok) {
          const submissionsPayload = await submissionsResponse.json();
          const submissions = Array.isArray(submissionsPayload.data?.submissions)
            ? submissionsPayload.data.submissions
            : [];
          entry.submissionLoaded = submissions.length > 0;
          entry.submissionTicketCount = submissions.length;
          entry.submissionMarkerCount = submissions.reduce((sum: number, submission: unknown) => {
            if (submission && typeof submission === "object") {
              const submissionRecord = submission as { markers?: unknown };
              if (Array.isArray(submissionRecord.markers)) {
                return sum + submissionRecord.markers.length;
              }
            }
            return sum;
          }, 0);
        } else if (submissionsResponse.status !== 404) {
          entry.errors.push(await extractErrorMessage(submissionsResponse));
        }
      } catch (error) {
        entry.errors.push(
          error instanceof Error ? error.message : "Failed to load submissions."
        );
      }

      if (entry.checkoutLoaded) {
        withCheckout += 1;
      }
      if (entry.submissionLoaded) {
        withSubmissions += 1;
      }
      totalMarkers += Math.max(entry.checkoutMarkerCount, entry.submissionMarkerCount);
      results.push(entry);
    }

    return {
      processed: results.length,
      withCheckout,
      withSubmissions,
      totalMarkers,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      results,
    };
  };

  const handleWinnerChange = (phase: PhaseId, index: number, field: keyof WinnerForm, value: string) => {
    setPhaseState(phase, (current) => {
      const winners = current.winners.map((winner, winnerIndex) =>
        winnerIndex === index ? { ...winner, [field]: value } : winner
      );
      return { ...current, winners };
    });
  };

  const handleTogglePublished = (phase: PhaseId, value: boolean) => {
    setPhaseState(phase, (current) => ({ ...current, published: value }));
    setPhaseFeedback((prev) => ({ ...prev, [phase]: { type: "success", text: value ? "Marked as published." : "Marked as draft." } }));
  };

  const handleNotesChange = (phase: PhaseId, value: string) => {
    setPhaseState(phase, (current) => ({ ...current, notes: value }));
  };

  const handleSavePhase = (phase: PhaseId) => {
    setPhaseState(phase, (current) => ({ ...current, lastUpdated: new Date().toISOString() }));
    setPhaseFeedback((prev) => ({ ...prev, [phase]: { type: "success", text: "Phase result saved." } }));
  };

  const handleResetPhase = (phase: PhaseId) => {
    const fresh = DEFAULT_PHASE_STATE();
    persistPhaseState(phase, fresh);
    setPhaseStates((prev) => ({ ...prev, [phase]: fresh }));
    setPhaseScanReports((prev) => ({ ...prev, [phase]: null }));
    setPhaseFeedback((prev) => ({ ...prev, [phase]: { type: "success", text: "Phase data cleared." } }));
  };

  const withPhaseBusy = async (phase: PhaseId, action: () => Promise<void>) => {
    setPhaseBusy((prev) => ({ ...prev, [phase]: true }));
    setPhaseFeedback((prev) => ({ ...prev, [phase]: null }));
    try {
      await action();
    } finally {
      setPhaseBusy((prev) => ({ ...prev, [phase]: false }));
    }
  };

  const handlePullStoredWinners = (phase: PhaseId) => {
    void withPhaseBusy(phase, async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          router.replace("/login");
          return;
        }

        const competitionId = competition?.id ?? DEFAULT_COMPETITION_ID;
        const payload = await fetchCompetitionResults(token, competitionId);
        const winners = mapWinnersToForm(payload.winners);

        // Refresh competition and coordinate inputs from server-side truth
        if (payload.competition) {
          setCompetition(createCompetitionSummary(payload.competition));
        } else {
          setCompetition(createCompetitionSummary({ id: competitionId }));
        }

        if (!winners.some((winner) => winner.name)) {
          setPhaseFeedback((prev) => ({ ...prev, [phase]: { type: "error", text: "No stored winners yet. Compute results first." } }));
          return;
        }

        setPhaseState(phase, (current) => ({
          ...current,
          winners,
          lastUpdated: new Date().toISOString(),
        }));
        setPhaseFeedback((prev) => ({ ...prev, [phase]: { type: "success", text: "Imported stored winners." } }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load winners.";
        setPhaseFeedback((prev) => ({ ...prev, [phase]: { type: "error", text: message } }));
      }
    });
  };

  const handleComputeAndFill = (phase: PhaseId) => {
    void withPhaseBusy(phase, async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const phaseStatus = phaseStatuses[phase];
        if (phaseStatus !== "ACTIVE") {
          const message = phaseStatus === "CLOSED"
            ? `${PHASES.find((definition) => definition.id === phase)?.name ?? "Phase"} is closed.`
            : `${PHASES.find((definition) => definition.id === phase)?.name ?? "Phase"} is not active yet.`;
          throw new Error(message);
        }

        // 1) Validate coordinates first
        const parseCoord = (label: string, value: string) => {
          if (value == null || value.trim() === "") {
            throw new Error(`${label} is required`);
          }
          const num = Number.parseFloat(value);
          if (!Number.isFinite(num)) {
            throw new Error(`${label} must be a number`);
          }
          if (num < 0 || num > 1) {
            throw new Error(`${label} must be between 0 and 1`);
          }
          return Number(num.toFixed(6));
        };

        const x = parseCoord("Final judge X", finalJudgeX);
        const y = parseCoord("Final judge Y", finalJudgeY);

        const competitionId = competition?.id ?? DEFAULT_COMPETITION_ID;

        // 2) Inspect participant data before computing winners
        setPhaseScanReports((prev) => ({ ...prev, [phase]: null }));
        const scanReport = await scanCompetitionEntries(token, competitionId);
        setPhaseScanReports((prev) => ({ ...prev, [phase]: scanReport }));

        if (scanReport.processed === 0) {
          throw new Error("No participants with checkout records found for this competition.");
        }

        const participantsWithMarkers = scanReport.results.filter((entry) =>
          entry.checkoutMarkerCount > 0 || entry.submissionMarkerCount > 0
        );
        if (participantsWithMarkers.length === 0) {
          throw new Error("No markers located for any participant. Review entry details before computing winners.");
        }

        const incompleteEntries = scanReport.results.filter((entry) =>
          entry.errors.length > 0 || !entry.checkoutLoaded || !entry.submissionLoaded
        );
        const issueCount = incompleteEntries.length;

        const readyParticipantCount = scanReport.processed - issueCount;
        if (readyParticipantCount <= 0) {
          throw new Error('No participants with complete entry data are available for computing winners yet.');
        }

        // 3) Save coordinates via PATCH before computing
        const saveResponse = await fetch(buildApiUrl(`admin/competitions/${competitionId}/final-result`), {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ finalJudgeX: x, finalJudgeY: y }),
        });
        if (!saveResponse.ok) {
          throw new Error(await extractErrorMessage(saveResponse));
        }
        // reflect saved coords in local competition summary
        setCompetition((prev) => createCompetitionSummary({ ...prev, finalJudgeX: x, finalJudgeY: y }));

        // 4) Compute winners
        const computeResponse = await fetch(buildApiUrl(`admin/competitions/${competitionId}/compute-winner`), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!computeResponse.ok) {
          throw new Error(await extractErrorMessage(computeResponse));
        }

        // 5) Pull and apply winners
        const payload = await fetchCompetitionResults(token, competitionId);
        if (payload.competition) {
          setCompetition(createCompetitionSummary(payload.competition));
        } else {
          setCompetition(createCompetitionSummary({ id: competitionId }));
        }
        const winners = mapWinnersToForm(payload.winners);
        setPhaseState(phase, (current) => ({
          ...current,
          winners,
          lastUpdated: new Date().toISOString(),
        }));
        const participantSummary = `Scanned ${scanReport.processed} participant${scanReport.processed === 1 ? "" : "s"}`;
        const checkoutSummary = `${scanReport.withCheckout} checkout${scanReport.withCheckout === 1 ? "" : "s"}`;
        const submissionSummary = `${scanReport.withSubmissions} submission${scanReport.withSubmissions === 1 ? "" : "s"}`;
        const markerSummary = `${scanReport.totalMarkers} marker${scanReport.totalMarkers === 1 ? "" : "s"} assessed`;
        const skippedSummary = issueCount
          ? ` Skipped ${issueCount} participant${issueCount === 1 ? "" : "s"} with missing data.`
          : "";
        const readySummary = ` Winners computed from ${readyParticipantCount} participant${readyParticipantCount === 1 ? "" : "s"}.`;
        setPhaseFeedback((prev) => ({
          ...prev,
          [phase]: {
            type: "success",
            text: `Winners computed and applied.${readySummary} ${participantSummary} · ${checkoutSummary} · ${submissionSummary} · ${markerSummary}.${skippedSummary}`,
          },
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to compute winners.";
        setPhaseFeedback((prev) => ({ ...prev, [phase]: { type: "error", text: message } }));
      }
    });
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
    }
    router.push("/login");
  };

  const summaryText = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${competition.ticketsSold}/${competition.maxEntries} tickets used`);
    parts.push(`${competition.markersPerTicket} markers per ticket`);
    if (typeof competition.finalJudgeX === "number" && typeof competition.finalJudgeY === "number") {
      parts.push(`Final judge (${competition.finalJudgeX.toFixed(3)}, ${competition.finalJudgeY.toFixed(3)})`);
    }
    return parts.join(" • ");
  }, [competition]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5 py-8 px-4">
      <div className="container-custom max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Result Declaration</h1>
            <p className="text-muted-foreground">Publish winners for each phase without switching competitions</p>
            {competition && (
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-semibold">{competition.title}</span> · {summaryText}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>Dashboard</Button>
            <Button variant="outline" onClick={() => router.push("/admin/entries")}>Entries</Button>
            <Button variant="outline" onClick={() => router.push("/admin/phases")}>Phases</Button>
            <Button variant="outline" onClick={() => router.push("/admin/settings")}>Settings</Button>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </div>
        </header>

        {loadError && (
          <div className="px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
            {loadError}
          </div>
        )}

        {/* Final judge coordinate inputs */}
        <section>
          <Card className="border-2 shadow-sm bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Final judge coordinates</CardTitle>
              <CardDescription>
                Set the X and Y (0 to 1) used to compute winners. These are saved automatically when you click &quot;Compute &amp; fill&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">X (0–1)</label>
                <input
                  inputMode="decimal"
                  value={finalJudgeX}
                  onChange={(e) => setFinalJudgeX(e.target.value)}
                  placeholder="e.g. 0.523"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Y (0–1)</label>
                <input
                  inputMode="decimal"
                  value={finalJudgeY}
                  onChange={(e) => setFinalJudgeY(e.target.value)}
                  placeholder="e.g. 0.412"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6">
          {PHASES.map(({ id, name, accent, badge }) => {
            const state = phaseStates[id];
            const status = phaseStatuses[id];
            const feedback = phaseFeedback[id];
            const busy = phaseBusy[id];
            const scanReport = phaseScanReports[id];
            const scanIssues = scanReport
              ? scanReport.results.filter((entry) =>
                  entry.errors.length > 0 || !entry.checkoutLoaded || !entry.submissionLoaded
                )
              : [];

            return (
              <Card key={id} className={cn("border-2", "shadow-sm", "bg-white/80", "backdrop-blur")}>
                <CardHeader className={cn("bg-gradient-to-r", accent, "rounded-t-xl")}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-xl">{name}</CardTitle>
                      <CardDescription>Declare and publish the top three winners</CardDescription>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", badge)}>
                      {status.replace("_", " ")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {feedback && (
                    <div
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm",
                        feedback.type === "success"
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-red-50 border border-red-200 text-red-700"
                      )}
                    >
                      {feedback.text}
                    </div>
                  )}

                  {scanReport && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold">Latest entry review</p>
                        <p className="text-xs text-blue-700/80">
                          Finished {formatTimestamp(scanReport.completedAt)}
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <span>Participants: {scanReport.processed}</span>
                        <span>Checkout records: {scanReport.withCheckout}</span>
                        <span>Submission records: {scanReport.withSubmissions}</span>
                        <span>Markers tallied: {scanReport.totalMarkers}</span>
                      </div>
                      {scanIssues.length > 0 ? (
                        <details className="rounded-md border border-blue-200 bg-white/90 p-3 text-xs text-blue-900">
                          <summary className="cursor-pointer font-semibold">
                            {scanIssues.length} participant{scanIssues.length === 1 ? "" : "s"} need review
                          </summary>
                          <div className="mt-2 space-y-3">
                            {scanIssues.slice(0, 10).map((entry) => {
                              const notes: string[] = [];
                              if (!entry.checkoutLoaded) {
                                notes.push("Checkout summary missing");
                              }
                              if (!entry.submissionLoaded) {
                                notes.push("Submissions missing");
                              }
                              if (entry.errors.length) {
                                notes.push(...entry.errors);
                              }
                              const uniqueNotes = Array.from(new Set(notes));
                              const keyId = entry.userId || entry.participantId;
                              return (
                                <div key={keyId} className="space-y-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium">
                                      User {keyId}
                                    </p>
                                    <a
                                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                                      href={`/admin/entries/${encodeURIComponent(keyId)}/view`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open entry ↗
                                    </a>
                                  </div>
                                  <ul className="list-disc space-y-1 pl-5">
                                    {uniqueNotes.map((note, index) => (
                                      <li key={index}>{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                            {scanIssues.length > 10 && (
                              <p className="text-[11px] text-blue-700/80">
                                Showing first 10 entries. Review the entries page for the complete list.
                              </p>
                            )}
                          </div>
                        </details>
                      ) : (
                        <p className="text-xs text-blue-700/80">
                          All scanned participants have checkout and submission data available.
                        </p>
                      )}

                      {scanReport.results.length > 0 && (
                        <details className="rounded-md border border-blue-200 bg-white/90 p-3 text-xs text-blue-900">
                          <summary className="cursor-pointer font-semibold">
                            Browse participant entries
                          </summary>
                          <div className="mt-2 space-y-3 max-h-72 overflow-y-auto pr-1">
                            {scanReport.results.map((entry) => {
                              const idForDisplay = entry.userId || entry.participantId;
                              const urlId = encodeURIComponent(idForDisplay);
                              return (
                                <article
                                  key={`${idForDisplay}-summary`}
                                  className="rounded-md border border-blue-100 bg-blue-50/60 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-blue-900">
                                        User {idForDisplay}
                                      </p>
                                      <p className="text-[11px] text-blue-700/80">
                                        Checkout markers: {entry.checkoutMarkerCount} · Submission markers: {entry.submissionMarkerCount}
                                      </p>
                                    </div>
                                    <a
                                      className="inline-flex items-center justify-center rounded-md border border-blue-600 px-2 py-[3px] text-[11px] font-semibold text-blue-600 hover:bg-blue-600 hover:text-white"
                                      href={`/admin/entries/${urlId}/view`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View details ↗
                                    </a>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {status !== "ACTIVE" && (
                    <div className="px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
                      {status === "CLOSED"
                        ? `${name} is closed. Winners are locked.`
                        : `${name} is not active yet. Activate this phase before declaring results.`}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {state.winners.map((winner, index) => (
                      <div key={index} className="space-y-3 rounded-lg border border-border p-4 bg-background/40">
                        <p className="text-sm font-semibold">Position {index + 1}</p>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium">Name</label>
                          <input
                            value={winner.name}
                            onChange={(event) => handleWinnerChange(id, index, "name", event.target.value)}
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Winner name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium">Ticket number</label>
                          <input
                            value={winner.ticketNumber}
                            onChange={(event) => handleWinnerChange(id, index, "ticketNumber", event.target.value)}
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="e.g. 104"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium">User ID</label>
                          <input
                            value={winner.userId}
                            onChange={(event) => handleWinnerChange(id, index, "userId", event.target.value)}
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="user-123456"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium">Phone</label>
                          <input
                            value={winner.phone}
                            onChange={(event) => handleWinnerChange(id, index, "phone", event.target.value)}
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Contact number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium">Distance</label>
                          <input
                            value={winner.distance}
                            onChange={(event) => handleWinnerChange(id, index, "distance", event.target.value)}
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="e.g. 0.0123"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium">Marker (x, y)</label>
                          <input
                            value={winner.marker}
                            onChange={(event) => handleWinnerChange(id, index, "marker", event.target.value)}
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="0.523, 0.412"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Notes for announcement</label>
                      <textarea
                        value={state.notes}
                        onChange={(event) => handleNotesChange(id, event.target.value)}
                        className="w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Optional context, prize details, or instructions"
                      />
                    </div>
                    <div className="flex flex-col justify-between gap-4">
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                        <input
                          id={`phase-${id}-published`}
                          type="checkbox"
                          checked={state.published}
                          onChange={(event) => handleTogglePublished(id, event.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <label htmlFor={`phase-${id}-published`} className="text-sm font-medium">
                          Mark as published
                        </label>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Status: <span className="font-medium">{state.published ? "Live" : "Draft"}</span></p>
                        <p>Last saved: <span className="font-medium">{formatTimestamp(state.lastUpdated)}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handlePullStoredWinners(id)}
                    >
                      {busy ? "Loading…" : "Load stored winners"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy || status !== "ACTIVE"}
                      onClick={() => handleComputeAndFill(id)}
                    >
                      {busy ? "Computing…" : status === "ACTIVE" ? "Compute & fill" : "Compute unavailable"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handleResetPhase(id)}
                    >
                      Clear
                    </Button>
                    <Button type="button" disabled={busy} onClick={() => handleSavePhase(id)}>
                      Save phase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}

const normalizePhaseState = (incoming: Partial<PhaseState> | undefined): PhaseState => {
  if (!incoming) {
    return DEFAULT_PHASE_STATE();
  }

  const winners = Array.isArray(incoming.winners)
    ? incoming.winners.slice(0, 3).map((winner) => {
        const hydrated = winner as (Partial<WinnerForm> & { participantId?: string }) | undefined;
        return {
          name: hydrated?.name ?? "",
          ticketNumber: hydrated?.ticketNumber ?? "",
          userId: hydrated?.userId ?? hydrated?.participantId ?? "",
          phone: hydrated?.phone ?? "",
          distance: hydrated?.distance ?? "",
          marker: hydrated?.marker ?? "",
        };
      })
    : [];

  while (winners.length < 3) {
    winners.push(EMPTY_WINNER());
  }

  return {
    published: incoming.published ?? false,
    winners,
    notes: incoming.notes ?? "",
    lastUpdated: incoming.lastUpdated ?? null,
  };
};

const mapWinnersToForm = (winners: BackendWinner[] | undefined): WinnerForm[] => {
  if (!winners || !winners.length) {
    return [EMPTY_WINNER(), EMPTY_WINNER(), EMPTY_WINNER()];
  }

  const mapped = winners.slice(0, 3).map((winner) => ({
    name: winner.participantName ?? "",
    ticketNumber: winner.ticketNumber != null ? String(winner.ticketNumber) : "",
  userId: winner.userId ?? winner.participantId ?? "",
    phone: winner.participantPhone ?? "",
    distance:
      typeof winner.distance === "number" && Number.isFinite(winner.distance)
        ? winner.distance.toFixed(4)
        : "",
    marker:
      winner.marker && Number.isFinite(winner.marker.x) && Number.isFinite(winner.marker.y)
        ? `${winner.marker.x.toFixed(3)}, ${winner.marker.y.toFixed(3)}`
        : "",
  }));

  while (mapped.length < 3) {
    mapped.push(EMPTY_WINNER());
  }

  return mapped;
};

type CompetitionResultsResponse = {
  competition: CompetitionSummary;
  result: {
    competitionId: string;
    finalJudgeX: number;
    finalJudgeY: number;
    computedAt: string;
  } | null;
  winners: BackendWinner[];
};

const fetchCompetitionResults = async (token: string, competitionId: string): Promise<CompetitionResultsResponse> => {
  const response = await fetch(buildApiUrl(`admin/competitions/${competitionId}/results`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();
  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message || "Failed to fetch results");
  }
  return payload.data as CompetitionResultsResponse;
};
