"use client";

/* eslint-disable react/no-unescaped-entities */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildApiUrl } from "@/lib/api";

interface Competition {
  id: string;
  title: string;
  maxEntries: number;
  ticketsSold: number;
  remainingSlots: number;
  status: "ACTIVE" | "CLOSED";
  imageUrl: string;
  pricePerTicket: number;
  markersPerTicket: number;
  createdAt: string;
  endsAt: string;
  finalJudgeX?: number | null;
  finalJudgeY?: number | null;
}

interface CompetitionWinner {
  ticketId: string;
  ticketNumber: number;
  participantId: string;
  participantName: string;
  participantPhone: string;
  distance: number;
  marker: {
    id: string;
    x: number;
    y: number;
  } | null;
}

interface CompetitionResultMeta {
  competitionId: string;
  finalJudgeX: number;
  finalJudgeY: number;
  computedAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isFetchingCompetitions, setIsFetchingCompetitions] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [participantId, setParticipantId] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formState, setFormState] = useState({
    title: "",
    maxEntries: 100,
    invitePassword: "",
    imageUrl: "",
    pricePerTicket: 500,
    markersPerTicket: 3,
    endsAt: "",
  });
  const [finalResultState, setFinalResultState] = useState({
    competitionId: "",
    finalJudgeX: "",
    finalJudgeY: "",
  });
  const [finalResultError, setFinalResultError] = useState<string | null>(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [winnerResult, setWinnerResult] = useState<{
    result: CompetitionResultMeta;
    winners: CompetitionWinner[];
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchCompetitions = useCallback(async () => {
    try {
      setIsFetchingCompetitions(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(buildApiUrl('admin/competitions'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load competitions');
      }

      setCompetitions(data.data.competitions ?? []);
    } catch (error) {
      console.error('Competition fetch error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to load competitions.',
      });
    } finally {
      setIsFetchingCompetitions(false);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchCompetitions();
  }, [fetchCompetitions, router]);

  const handleAssignTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsAssigning(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
  buildApiUrl(`admin/competitions/${selectedCompetition}/assign-tickets`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            participantId,
            ticketCount: parseInt(ticketCount.toString()),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign tickets');
      }

      setMessage({
        type: 'success',
        text: data.data.message,
      });

      // Update local competition data
      setCompetitions(prev =>
        prev.map(comp =>
          comp.id === selectedCompetition
            ? {
                ...comp,
                ticketsSold: data.data.newTicketsSold,
                remainingSlots: data.data.remainingSlots,
              }
            : comp
        )
      );

      // Reset form
      setParticipantId('');
      setTicketCount(1);
    } catch (error) {
      console.error('Error assigning tickets:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to assign tickets',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin');
  };

  const handleCreateCompetition = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

  const response = await fetch(buildApiUrl('admin/competitions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formState,
          endsAt: formState.endsAt || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || data.errors?.[0]?.msg || 'Failed to create competition'
        );
      }

      setIsCreateOpen(false);
      setFormState({
        title: "",
        maxEntries: 100,
        invitePassword: "",
        imageUrl: "",
        pricePerTicket: 500,
        markersPerTicket: 3,
        endsAt: "",
      });

      setMessage({
        type: 'success',
        text: 'Competition created successfully.',
      });

      await fetchCompetitions();
    } catch (error) {
      console.error('Create competition error:', error);
      setCreateError(error instanceof Error ? error.message : 'Could not create competition.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCompetition = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

  const response = await fetch(buildApiUrl(`admin/competitions/${id}/close`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to close competition');
      }

      setCompetitions((prev) =>
        prev.map((competition) =>
          competition.id === id ? data.data.competition : competition
        )
      );
      setMessage({ type: 'success', text: 'Competition closed successfully.' });
    } catch (error) {
      console.error('Close competition error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not close competition.',
      });
    }
  };

  const handleSubmitFinalResult = async (event: React.FormEvent) => {
    event.preventDefault();
    setFinalResultError(null);
    setMessage(null);
    setComputeError(null);
    setExportError(null);
    setWinnerResult(null);

    if (!finalResultState.competitionId) {
      setFinalResultError('Select a competition to update.');
      return;
    }

    if (finalResultState.finalJudgeX === '' || finalResultState.finalJudgeY === '') {
      setFinalResultError('Provide both X and Y coordinates.');
      return;
    }

    const finalJudgeXValue = Number(finalResultState.finalJudgeX);
    const finalJudgeYValue = Number(finalResultState.finalJudgeY);

    if (
      Number.isNaN(finalJudgeXValue) ||
      Number.isNaN(finalJudgeYValue) ||
      finalJudgeXValue < 0 ||
      finalJudgeXValue > 1 ||
      finalJudgeYValue < 0 ||
      finalJudgeYValue > 1
    ) {
      setFinalResultError('Coordinates must be numeric values between 0 and 1.');
      return;
    }

    setIsSubmittingFinal(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(
  buildApiUrl(`admin/competitions/${finalResultState.competitionId}/final-result`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            finalJudgeX: finalJudgeXValue,
            finalJudgeY: finalJudgeYValue,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || data.errors?.[0]?.msg || 'Failed to save final judged coordinates.'
        );
      }

      const updatedCompetition = data.data?.competition as Competition | undefined;
      if (updatedCompetition) {
        setCompetitions((prev) =>
          prev.map((competition) =>
            competition.id === updatedCompetition.id ? updatedCompetition : competition
          )
        );

        setFinalResultState({
          competitionId: updatedCompetition.id,
          finalJudgeX:
            typeof updatedCompetition.finalJudgeX === 'number'
              ? updatedCompetition.finalJudgeX.toString()
              : '',
          finalJudgeY:
            typeof updatedCompetition.finalJudgeY === 'number'
              ? updatedCompetition.finalJudgeY.toString()
              : '',
        });
      }

      setMessage({
        type: 'success',
        text: 'Final judged coordinates saved.',
      });
    } catch (error) {
      console.error('Final result submission error:', error);
      setFinalResultError(
        error instanceof Error ? error.message : 'Failed to store final judged coordinates.'
      );
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const handleComputeWinners = async () => {
    setComputeError(null);
    setMessage(null);
    setExportError(null);

    if (!finalResultState.competitionId) {
      setComputeError('Select a competition to compute winners.');
      return;
    }

    setIsComputing(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(
  buildApiUrl(`admin/competitions/${finalResultState.competitionId}/compute-winner`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to compute winners.');
      }

      const resultPayload = data.data?.result as CompetitionResultMeta | undefined;
      const winnersPayload = data.data?.winners as CompetitionWinner[] | undefined;

      if (resultPayload) {
        setWinnerResult({
          result: resultPayload,
          winners: winnersPayload ?? [],
        });

        setMessage({
          type: 'success',
          text: 'Winners computed successfully.',
        });
      } else {
        throw new Error('Unexpected response received from compute endpoint.');
      }
    } catch (error) {
      console.error('Compute winners error:', error);
      setComputeError(
        error instanceof Error ? error.message : 'Failed to compute winners.'
      );
      setWinnerResult(null);
    } finally {
      setIsComputing(false);
    }
  };

  const handleExportResults = async () => {
    setExportError(null);
    setMessage(null);

    if (!finalResultState.competitionId) {
      setExportError('Select a competition to export results.');
      return;
    }

    setIsExporting(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(
  buildApiUrl(`admin/competitions/${finalResultState.competitionId}/export`),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to export results.';
        if (errorText) {
          try {
            const parsed = JSON.parse(errorText);
            errorMessage =
              parsed?.message || parsed?.error || errorMessage;
          } catch {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      if (typeof window === 'undefined') {
        setMessage({ type: 'success', text: 'Results export completed.' });
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `competition-${finalResultState.competitionId}-results.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Results export started (CSV download).',
      });
    } catch (error) {
      console.error('Export results error:', error);
      setExportError(
        error instanceof Error ? error.message : 'Failed to export results.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const activeCompetitions = useMemo(
    () => competitions.filter((competition) => competition.status === 'ACTIVE'),
    [competitions]
  );

  const selectedFinalCompetition = useMemo(
    () => competitions.find((competition) => competition.id === finalResultState.competitionId),
    [competitions, finalResultState.competitionId]
  );

  useEffect(() => {
    if (competitions.length === 0 || finalResultState.competitionId) {
      return;
    }

    const defaultCompetition =
      competitions.find((competition) => competition.status === 'CLOSED') ?? competitions[0];

    if (defaultCompetition) {
      setFinalResultState({
        competitionId: defaultCompetition.id,
        finalJudgeX:
          typeof defaultCompetition.finalJudgeX === 'number'
            ? defaultCompetition.finalJudgeX.toString()
            : '',
        finalJudgeY:
          typeof defaultCompetition.finalJudgeY === 'number'
            ? defaultCompetition.finalJudgeY.toString()
            : '',
      });
    }
  }, [competitions, finalResultState.competitionId]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5 py-8 px-4">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage competitions and tickets</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsCreateOpen((prev) => !prev)}>
              {isCreateOpen ? 'Cancel' : 'New Competition'}
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Competitions List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Competitions</CardTitle>
              <CardDescription>View and manage ongoing competitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isFetchingCompetitions ? (
                  <div className="text-sm text-muted-foreground">Refreshing competitions…</div>
                ) : competitions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No competitions yet. Create one to get started.
                  </div>
                ) : (
                  competitions.map((competition) => {
                    const isActive = competition.status === 'ACTIVE';
                    return (
                      <div
                        key={competition.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold mb-1 flex items-center gap-2">
                              {competition.title}
                              <span
                                className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {competition.status}
                              </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Ends {new Date(competition.endsAt).toLocaleString()}
                            </p>
                          </div>
                          {isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCloseCompetition(competition.id)}
                            >
                              Close competition
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tickets Sold:</span>
                            <span className="ml-2 font-medium">{competition.ticketsSold}/{competition.maxEntries}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className="ml-2 font-medium">{competition.remainingSlots}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price per ticket:</span>
                            <span className="ml-2 font-medium">₹{competition.pricePerTicket}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Markers per ticket:</span>
                            <span className="ml-2 font-medium">{competition.markersPerTicket}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {typeof competition.finalJudgeX === 'number' && typeof competition.finalJudgeY === 'number'
                            ? `Final judged coordinate: (${competition.finalJudgeX.toFixed(3)}, ${competition.finalJudgeY.toFixed(3)})`
                            : 'Final judged coordinate pending'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Tickets</CardTitle>
              <CardDescription>Reserve tickets for participants</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignTickets} className="space-y-4">
                <div>
                  <label htmlFor="competition" className="block text-sm font-medium mb-2">
                    Competition
                  </label>
                  <select
                    id="competition"
                    value={selectedCompetition}
                    onChange={(e) => setSelectedCompetition(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Select a competition</option>
                    {activeCompetitions.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="participantId" className="block text-sm font-medium mb-2">
                    Participant ID
                  </label>
                  <input
                    type="text"
                    id="participantId"
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter participant ID"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The participant must be registered in the system
                  </p>
                </div>

                <div>
                  <label htmlFor="ticketCount" className="block text-sm font-medium mb-2">
                    Number of Tickets
                  </label>
                  <input
                    type="number"
                    id="ticketCount"
                    value={ticketCount}
                    onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                {message && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isAssigning || !selectedCompetition || !participantId}
                >
                  {isAssigning ? 'Assigning...' : 'Assign Tickets'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-semibold mb-2">ℹ️ How it works:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Tickets are created with status "RESERVED"</li>
                  <li>• Competition ticket count is automatically updated</li>
                  <li>• Participants can view their tickets in their dashboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Final Result Entry */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Enter Judged Coordinates</CardTitle>
              <CardDescription>Record the final judge decision (values between 0 and 1)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFinalResult} className="space-y-4">
                <div>
                  <label htmlFor="final-competition" className="block text-sm font-medium mb-2">
                    Competition
                  </label>
                  <select
                    id="final-competition"
                    value={finalResultState.competitionId}
                    onChange={(event) => {
                      const competitionId = event.target.value;
                      const competition = competitions.find((item) => item.id === competitionId);

                      setFinalResultState({
                        competitionId,
                        finalJudgeX:
                          competition && typeof competition.finalJudgeX === 'number'
                            ? competition.finalJudgeX.toString()
                            : '',
                        finalJudgeY:
                          competition && typeof competition.finalJudgeY === 'number'
                            ? competition.finalJudgeY.toString()
                            : '',
                      });
                      setWinnerResult(null);
                      setComputeError(null);
                      setExportError(null);
                    }}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Select a competition</option>
                    {competitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {competition.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="finalJudgeX" className="block text-sm font-medium mb-2">
                      X coordinate
                    </label>
                    <input
                      id="finalJudgeX"
                      type="number"
                      min={0}
                      max={1}
                      step={0.0001}
                      value={finalResultState.finalJudgeX}
                      onChange={(event) => {
                        setFinalResultState((prev) => ({
                          ...prev,
                          finalJudgeX: event.target.value,
                        }));
                        setExportError(null);
                        setWinnerResult(null);
                      }}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="finalJudgeY" className="block text-sm font-medium mb-2">
                      Y coordinate
                    </label>
                    <input
                      id="finalJudgeY"
                      type="number"
                      min={0}
                      max={1}
                      step={0.0001}
                      value={finalResultState.finalJudgeY}
                      onChange={(event) => {
                        setFinalResultState((prev) => ({
                          ...prev,
                          finalJudgeY: event.target.value,
                        }));
                        setExportError(null);
                        setWinnerResult(null);
                      }}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                {selectedFinalCompetition &&
                  typeof selectedFinalCompetition.finalJudgeX === 'number' &&
                  typeof selectedFinalCompetition.finalJudgeY === 'number' && (
                    <p className="text-xs text-muted-foreground">
                      {`Stored coordinate: (${selectedFinalCompetition.finalJudgeX.toFixed(3)}, ${selectedFinalCompetition.finalJudgeY.toFixed(3)})`}
                    </p>
                  )}

                {finalResultError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
                    {finalResultError}
                  </div>
                )}

                {computeError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
                    {computeError}
                  </div>
                )}

                {exportError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
                    {exportError}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmittingFinal || !finalResultState.competitionId}
                  >
                    {isSubmittingFinal ? 'Saving…' : 'Save final result'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleComputeWinners}
                    disabled={
                      isComputing ||
                      !finalResultState.competitionId ||
                      finalResultState.finalJudgeX === '' ||
                      finalResultState.finalJudgeY === ''
                    }
                  >
                    {isComputing ? 'Computing…' : 'Compute winners'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleExportResults}
                    disabled={
                      isExporting ||
                      !finalResultState.competitionId ||
                      finalResultState.finalJudgeX === '' ||
                      finalResultState.finalJudgeY === ''
                    }
                  >
                    {isExporting ? 'Exporting…' : 'Export results'}
                  </Button>
                </div>

                {winnerResult && (
                  <div className="mt-6 border border-border rounded-lg p-4 space-y-3 bg-muted/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-sm font-medium">
                        Final judged coordinate: (
                        {winnerResult.result.finalJudgeX.toFixed(3)},
                        {winnerResult.result.finalJudgeY.toFixed(3)})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Computed at {new Date(winnerResult.result.computedAt).toLocaleString()}
                      </p>
                    </div>

                    {winnerResult.winners.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No markers submitted yet, winners cannot be determined.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {winnerResult.winners.map((winner, index) => (
                          <div
                            key={winner.ticketId}
                            className="rounded-md border border-border bg-background p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">#{index + 1}: {winner.participantName}</span>
                              <span className="text-xs text-muted-foreground">
                                Ticket {winner.ticketNumber}
                              </span>
                            </div>
                            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                              <span>Participant ID: {winner.participantId}</span>
                              <span>Phone: {winner.participantPhone}</span>
                              <span>Distance: {winner.distance.toFixed(4)}</span>
                              {winner.marker && (
                                <span>
                                  Marker: ({winner.marker.x.toFixed(3)}, {winner.marker.y.toFixed(3)})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {isCreateOpen && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Create Competition</CardTitle>
              <CardDescription>Launch a new password-protected competition</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCompetition} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
                    <input
                      id="title"
                      value={formState.title}
                      onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="maxEntries" className="block text-sm font-medium mb-2">Max entries</label>
                    <input
                      id="maxEntries"
                      type="number"
                      min={1}
                      value={formState.maxEntries}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          maxEntries: parseInt(event.target.value, 10) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="invitePassword" className="block text-sm font-medium mb-2">Invite password</label>
                    <input
                      id="invitePassword"
                      value={formState.invitePassword}
                      onChange={(event) => setFormState((prev) => ({ ...prev, invitePassword: event.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium mb-2">Image URL</label>
                    <input
                      id="imageUrl"
                      type="url"
                      value={formState.imageUrl}
                      onChange={(event) => setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="pricePerTicket" className="block text-sm font-medium mb-2">Price per ticket (₹)</label>
                    <input
                      id="pricePerTicket"
                      type="number"
                      min={0}
                      value={formState.pricePerTicket}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          pricePerTicket: parseFloat(event.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="markersPerTicket" className="block text-sm font-medium mb-2">Markers per ticket</label>
                    <input
                      id="markersPerTicket"
                      type="number"
                      min={1}
                      value={formState.markersPerTicket}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          markersPerTicket: parseInt(event.target.value, 10) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="endsAt" className="block text-sm font-medium mb-2">Ends at (optional)</label>
                    <input
                      id="endsAt"
                      type="datetime-local"
                      value={formState.endsAt}
                      onChange={(event) => setFormState((prev) => ({ ...prev, endsAt: event.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
                    {createError}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating…' : 'Create competition'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
