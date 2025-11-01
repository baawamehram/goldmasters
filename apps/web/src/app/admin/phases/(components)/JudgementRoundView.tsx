'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkerCanvasClient, {
  MarkerCanvasHandle,
  MARKER_COLORS,
} from '@/components/MarkerCanvasClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MARKER_LIMIT = 4;

const JUDGES = [
  { id: 'judge-1', name: 'Judge 1' },
  { id: 'judge-2', name: 'Judge 2' },
  { id: 'judge-3', name: 'Judge 3' },
  { id: 'judge-4', name: 'Judge 4' },
] as const;

export type MarkerState = 'placed' | 'active' | 'pending';

interface MarkerSnapshot {
  id: string;
  ticketId: string;
  ticketNumber: number;
  state: MarkerState;
  x: number;
  y: number;
  label: string;
}

interface SubmittedSummary {
  submittedAt: string;
  average: {
    x: number;
    y: number;
  };
  markers: MarkerSnapshot[];
}

interface JudgementRoundViewProps {
  phaseId: number;
  title: string;
  description: string;
}

interface MarkerSummaryState {
  placed: number;
  remaining: number;
  activeJudgeId: string | null;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
const formatNormalized = (value: number) => value.toFixed(4);
const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

const findNextJudgeId = (markers: MarkerSnapshot[]) => {
  const placedJudgeIds = new Set(
    markers.filter((marker) => marker.state === 'placed').map((marker) => marker.ticketId)
  );

  return (
    JUDGES.find((judge) => !placedJudgeIds.has(judge.id))?.id ?? null
  );
};

export default function JudgementRoundView({
  phaseId,
  title,
  description,
}: JudgementRoundViewProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const canvasRef = useRef<MarkerCanvasHandle>(null);
  const [markersSnapshot, setMarkersSnapshot] = useState<MarkerSnapshot[]>([]);
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedSummary | null>(null);
  const [markerSummary, setMarkerSummary] = useState<MarkerSummaryState>({
    placed: 0,
    remaining: MARKER_LIMIT,
    activeJudgeId: JUDGES[0]?.id ?? null,
  });

  const summaryStorageKey = useMemo(
    () => `admin_phase${phaseId}_judgement_summary`,
    [phaseId]
  );

  const judgeNameById = useMemo(
    () => new Map<string, string>(JUDGES.map((judge) => [judge.id, judge.name])),
    []
  );

  const judgeColorById = useMemo(
    () =>
      new Map<string, string>(
        JUDGES.map((judge, index) => [judge.id, MARKER_COLORS[index % MARKER_COLORS.length]])
      ),
    []
  );

  const normalizeMarkers = useCallback(
    (markers: MarkerSnapshot[]): MarkerSnapshot[] =>
      JUDGES.map((judge, index) => {
        const fallbackLabel = judge.name ?? `Judge ${index + 1}`;
        const existing = markers.find((marker) => marker.ticketId === judge.id);

        if (!existing) {
          return null;
        }

        return {
          id: existing.id,
          ticketId: judge.id,
          ticketNumber: index + 1,
          state: existing.state ?? 'placed',
          x: existing.x,
          y: existing.y,
          label: existing.label ?? fallbackLabel,
        };
      }).filter(Boolean) as MarkerSnapshot[],
    []
  );

  const loadStoredSummary = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const stored = localStorage.getItem(summaryStorageKey);
    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as SubmittedSummary;
      if (!parsed || !Array.isArray(parsed.markers)) {
        return null;
      }

      return {
        ...parsed,
        markers: normalizeMarkers(
          parsed.markers.map((marker, index) => ({
            ...marker,
            ticketId: marker.ticketId ?? JUDGES[index]?.id ?? `judge-${index + 1}`,
            ticketNumber: marker.ticketNumber ?? index + 1,
            state: marker.state ?? 'placed',
            label:
              marker.label ?? judgeNameById.get(marker.ticketId ?? '') ?? `Judge ${index + 1}`,
          }))
        ),
      } satisfies SubmittedSummary;
    } catch (error) {
      console.warn('Failed to parse stored judgement summary:', error);
      return null;
    }
  }, [judgeNameById, normalizeMarkers, summaryStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedImage = localStorage.getItem(`admin_phase${phaseId}_image_url`);
    setImageUrl(storedImage || null);

    const storedSummary = loadStoredSummary();
    if (storedSummary) {
      setSubmittedSummary(storedSummary);
      setMarkersSnapshot(storedSummary.markers);
      setMarkerSummary({ placed: MARKER_LIMIT, remaining: 0, activeJudgeId: null });
    } else {
      setSubmittedSummary(null);
      setMarkersSnapshot([]);
      setMarkerSummary({
        placed: 0,
        remaining: MARKER_LIMIT,
        activeJudgeId: JUDGES[0]?.id ?? null,
      });
    }

    setCanvasKey((prev) => prev + 1);
    setIsReady(true);
  }, [loadStoredSummary, phaseId]);

  const baseTickets = useMemo(
    () =>
      JUDGES.map((judge, index) => ({
        id: judge.id,
        status: 'ASSIGNED' as const,
        ticketNumber: index + 1,
        markersAllowed: 1,
        markers: [],
      })),
    []
  );

  const submittedTickets = useMemo(() => {
    if (!submittedSummary) {
      return null;
    }

    return submittedSummary.markers.map((marker) => ({
      id: marker.ticketId,
      status: 'SUBMITTED' as const,
      ticketNumber: marker.ticketNumber,
      markersAllowed: 1,
      markers: [{ id: marker.id, x: marker.x, y: marker.y }],
    }));
  }, [submittedSummary]);

  const tickets = submittedTickets ?? baseTickets;

  const handleMarkersChange = useCallback(
    (markers: Array<{
      id: string;
      ticketId: string;
      ticketNumber: number;
      state: MarkerState;
      x: number;
      y: number;
      label: string;
    }>) => {
      if (submittedSummary) {
        return;
      }

      const mapped = markers.map((marker) => ({
        id: marker.id,
        ticketId: marker.ticketId,
        ticketNumber: marker.ticketNumber,
        state: marker.state,
        x: marker.x,
        y: marker.y,
        label: judgeNameById.get(marker.ticketId) ?? marker.label,
      }));

      setMarkersSnapshot(mapped);

      const placedCount = mapped.filter((marker) => marker.state === 'placed').length;
      const activeMarker = mapped.find((marker) => marker.state === 'active');

      setMarkerSummary({
        placed: placedCount,
        remaining: Math.max(MARKER_LIMIT - placedCount, 0),
        activeJudgeId: activeMarker?.ticketId ?? findNextJudgeId(mapped),
      });
    },
    [findNextJudgeId, judgeNameById, submittedSummary]
  );

  const computeAveragePosition = useCallback((markers: MarkerSnapshot[]) => {
    if (!markers.length) {
      return { x: 0, y: 0 };
    }

    const total = markers.reduce(
      (acc, marker) => ({
        x: acc.x + marker.x,
        y: acc.y + marker.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: total.x / markers.length,
      y: total.y / markers.length,
    };
  }, []);

  const handlePlaceMarker = () => {
    if (submittedSummary) {
      return;
    }
    const result = canvasRef.current?.placeCurrentMarker();
    if (!result || !result.placed) {
      return;
    }
  };

  const handleUndoMarker = () => {
    if (submittedSummary) {
      return;
    }
    const undone = canvasRef.current?.undoLastPlacement();
    if (!undone) {
      return;
    }
  };

  const handleResetMarkers = () => {
    if (submittedSummary) {
      const confirmReset = window.confirm(
        'Start a new judgement? This will clear the submitted markers.'
      );
      if (!confirmReset) {
        return;
      }
    }

    setCanvasKey((prev) => prev + 1);
    setMarkersSnapshot([]);
    setSubmittedSummary(null);
    setMarkerSummary({
      placed: 0,
      remaining: MARKER_LIMIT,
      activeJudgeId: JUDGES[0]?.id ?? null,
    });

    if (typeof window !== 'undefined') {
      localStorage.removeItem(summaryStorageKey);
    }
  };

  const handleZoomIn = () => canvasRef.current?.zoomIn();
  const handleZoomOut = () => canvasRef.current?.zoomOut();

  const handleSubmitMarkers = () => {
    if (submittedSummary) {
      return;
    }

    const placedMarkers = markersSnapshot.filter((marker) => marker.state === 'placed');
    if (placedMarkers.length !== MARKER_LIMIT) {
      return;
    }

    const confirmed = window.confirm(
      'Submit these judgement markers? You will not be able to edit after confirming.'
    );
    if (!confirmed) {
      return;
    }

    const average = computeAveragePosition(placedMarkers);
    const nextSummary: SubmittedSummary = {
      submittedAt: new Date().toISOString(),
      markers: placedMarkers,
      average,
    };

    setSubmittedSummary(nextSummary);
    setMarkerSummary({ placed: MARKER_LIMIT, remaining: 0, activeJudgeId: null });

    if (typeof window !== 'undefined') {
      localStorage.setItem(summaryStorageKey, JSON.stringify(nextSummary));
    }
  };

  if (!isReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">Preparing judgement round…</div>
      </main>
    );
  }

  if (!imageUrl) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-white to-brand-accent/10 py-10 px-4">
        <div className="container-custom max-w-4xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading text-brand-primary">{title}</h1>
              <p className="mt-2 text-muted-foreground">{description}</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/phases')}>
              Back to Phases
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>No phase image available</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>Upload a competition image for this phase before starting the judgement round.</p>
              <Button onClick={() => router.push('/admin/phases')}>
                Go to Phase Management
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const markerGuidance = submittedSummary
    ? 'Judgement submitted. All markers are locked.'
    : (() => {
        const activeJudge = JUDGES.find((judge) => judge.id === markerSummary.activeJudgeId);
        if (!activeJudge) {
          return 'All judges have placed their markers. Submit to lock in the judgement.';
        }
        return `${activeJudge.name} is placing their marker. Drag the crosshair, then press Place Marker to lock.`;
      })();

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-white to-brand-accent/10 py-10 px-4">
      <div className="container-custom max-w-6xl space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold font-heading text-brand-primary">{title}</h1>
            <p className="mt-3 text-muted-foreground">{description}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/phases')}>
            Back to Phases
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg">
              <MarkerCanvasClient
                key={canvasKey}
                ref={canvasRef}
                imageUrl={imageUrl ?? ''}
                tickets={tickets}
                markersPerTicket={1}
                onMarkersChange={handleMarkersChange}
                showPanels={false}
              />
              {submittedSummary && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-slate-950/70 text-center text-sm font-semibold text-emerald-100">
                  <span>Judgement submitted</span>
                  <span className="mt-1 text-xs text-emerald-200/80">
                    Start a new judgement to adjust markers.
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handlePlaceMarker}
                disabled={Boolean(submittedSummary) || markerSummary.activeJudgeId === null}
              >
                Place Marker
              </Button>
              <Button
                onClick={handleUndoMarker}
                variant="outline"
                disabled={markerSummary.placed === 0 || Boolean(submittedSummary)}
              >
                Undo Last
              </Button>
              <Button onClick={handleResetMarkers} variant="outline">
                {submittedSummary ? 'Start New Judgement' : 'Reset Markers'}
              </Button>
              <Button onClick={handleZoomIn} variant="outline" disabled={Boolean(submittedSummary)}>
                Zoom In
              </Button>
              <Button onClick={handleZoomOut} variant="outline" disabled={Boolean(submittedSummary)}>
                Zoom Out
              </Button>
              <Button
                onClick={handleSubmitMarkers}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                disabled={markerSummary.remaining !== 0 || submittedSummary !== null}
              >
                Submit Judgement
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Judge Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {JUDGES.map((judge) => {
                  const marker = markersSnapshot.find((item) => item.ticketId === judge.id);
                  const isActive = markerSummary.activeJudgeId === judge.id;
                  const markerColor = judgeColorById.get(judge.id) ?? '#0EA5E9';
                  const status = submittedSummary
                    ? 'Submitted'
                    : marker?.state === 'placed'
                      ? 'Complete'
                      : isActive
                        ? 'In progress'
                        : 'Waiting';

                  return (
                    <div
                      key={judge.id}
                      className="flex items-center justify-between rounded-2xl border px-3 py-2 transition-colors"
                      style={{
                        borderColor: isActive && !submittedSummary ? markerColor : `${markerColor}55`,
                        background: isActive && !submittedSummary ? `${markerColor}10` : '#ffffff',
                        boxShadow: isActive && !submittedSummary ? `0 0 12px ${markerColor}33` : undefined,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-1 inline-flex h-3 w-3 rounded-full"
                          style={{ backgroundColor: markerColor }}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: markerColor }}>
                            {judge.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {marker
                              ? `Marker locked at X ${formatPercent(marker.x)}, Y ${formatPercent(marker.y)}`
                              : 'Awaiting placement'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: markerColor }}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Round Guidance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{markerGuidance}</p>
                <p>
                  Each judge places exactly one marker. Once all four markers are locked, submit the
                  round to publish the average position.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Markers placed</span>
                  <span className="text-base font-semibold">
                    {markerSummary.placed} / {MARKER_LIMIT}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Markers remaining</span>
                  <span className="text-base font-semibold">{markerSummary.remaining}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {submittedSummary && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 text-slate-100 shadow-2xl">
            <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-900 p-8">
              <header className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Judgement Summary</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200">
                    Submitted {formatDateTime(submittedSummary.submittedAt)}
                  </span>
                </div>
                <p className="text-sm text-emerald-100/80 max-w-2xl">
                  All four markers are locked in. Below is the averaged judgement position together with individual marker coordinates, mirroring the checkout experience from the live game.
                </p>
              </header>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Average X (normalized)</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatNormalized(submittedSummary.average.x)}
                  </p>
                  <p className="text-sm text-emerald-300">
                    {formatPercent(submittedSummary.average.x)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Average Y (normalized)</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatNormalized(submittedSummary.average.y)}
                  </p>
                  <p className="text-sm text-emerald-300">
                    {formatPercent(submittedSummary.average.y)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Total Markers</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {submittedSummary.markers.length}
                  </p>
                  <p className="text-sm text-slate-400">Judgement markers recorded</p>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <h3 className="text-lg font-semibold text-white">Marker Breakdown</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {submittedSummary.markers.map((marker) => {
                    const color = judgeColorById.get(marker.ticketId) ?? '#22D3EE';
                    return (
                      <article
                        key={marker.id}
                        className="flex flex-col gap-3 rounded-2xl border bg-slate-950/70 p-4"
                        style={{
                          borderColor: `${color}88`,
                          boxShadow: `0 0 14px ${color}22`,
                        }}
                      >
                        <header className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-semibold text-white">
                            <span
                              className="inline-flex h-3 w-3 rounded-full"
                              style={{ backgroundColor: color }}
                              aria-hidden="true"
                            />
                            {marker.label}
                          </span>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${color}1a`,
                              color,
                              border: `1px solid ${color}66`,
                            }}
                          >
                            Locked
                          </span>
                        </header>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-200">
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
                            <dd style={{ color }}>{formatPercent(marker.x)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">Y (canvas)</dt>
                            <dd style={{ color }}>{formatPercent(marker.y)}</dd>
                          </div>
                        </dl>
                        <footer className="mt-auto text-[11px] text-slate-500">
                          Marker ID: <span className="font-mono text-slate-400">{marker.id}</span>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => router.push('/admin/results')}
                  className="group flex w-full flex-col gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-500/20 hover:shadow-xl"
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200 group-hover:text-emerald-100">
                    Results Overview
                  </span>
                  <span className="text-xl font-semibold text-white group-hover:text-emerald-50">
                    Open Phase Results Workspace
                  </span>
                  <span className="text-sm text-emerald-100/80">
                    Review winners, export standings, and publish final outcomes for every phase.
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
