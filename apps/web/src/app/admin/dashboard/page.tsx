"use client";

/* eslint-disable react/no-unescaped-entities */
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildApiUrl } from "@/lib/api";
import ViewEntryDetailsModal from "@/components/ViewEntryDetailsModal";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isFetchingCompetitions, setIsFetchingCompetitions] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
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
  const [maxCompetitionTickets, setMaxCompetitionTickets] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(500);
  const [ticketsSold, setTicketsSold] = useState(3); // This would come from actual data
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [highlightedParticipantId, setHighlightedParticipantId] = useState<string | null>(null);

  const fetchCompetitions = useCallback(async () => {
    try {
      setIsFetchingCompetitions(true);
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin");
        return;
      }

      const response = await fetch(buildApiUrl("admin/competitions"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load competitions");
      }

      setCompetitions(data.data.competitions ?? []);
    } catch (error) {
      console.error("Competition fetch error:", error);
    } finally {
      setIsFetchingCompetitions(false);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const savedMaxCompetitionTickets = localStorage.getItem("admin_max_competition_tickets");
    if (savedMaxCompetitionTickets) {
      setMaxCompetitionTickets(parseInt(savedMaxCompetitionTickets, 10));
    }

    const savedTicketPrice = localStorage.getItem("admin_ticket_price");
    if (savedTicketPrice) {
      setTicketPrice(parseInt(savedTicketPrice, 10));
    }

    const savedCompetitionId = localStorage.getItem("admin_selected_competition");
    if (savedCompetitionId) {
      setSelectedCompetition(savedCompetitionId);
    }

    const highlight = searchParams.get("highlight");
    if (highlight && highlight.startsWith("user-")) {
      const userId = highlight.replace("user-", "");
      setHighlightedParticipantId(userId);
      setShowViewDetailsModal(true);
    }

    fetchCompetitions();
  }, [fetchCompetitions, router, searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/login");
  };

  const handleCreateCompetition = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin");
        return;
      }

      const response = await fetch(buildApiUrl("admin/competitions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          data.message || data.errors?.[0]?.msg || "Failed to create competition"
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

      console.log("Competition created successfully.");

      await fetchCompetitions();
    } catch (error) {
      console.error("Create competition error:", error);
      setCreateError(error instanceof Error ? error.message : "Could not create competition.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCompetition = async (id: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin");
        return;
      }

      const response = await fetch(buildApiUrl(`admin/competitions/${id}/close`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to close competition");
      }

      setCompetitions((prev) =>
        prev.map((competition) =>
          competition.id === id ? data.data.competition : competition
        )
      );

      console.log("Competition closed successfully.");
    } catch (error) {
      console.error("Close competition error:", error);
    }
  };

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage competitions and tickets</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/admin/phases")}>
              Phases
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/results")}>
              Results
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/entries")}>
              View Entries
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/settings")}>
              Settings
            </Button>
            <Button variant="outline" onClick={() => setIsCreateOpen((prev) => !prev)}>
              {isCreateOpen ? "Cancel" : "New Competition"}
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    const isActive = competition.status === "ACTIVE";
                    const displayMaxTickets = maxCompetitionTickets || competition.maxEntries;
                    const displayTicketsSold = ticketsSold;
                    const displayRemaining = displayMaxTickets - displayTicketsSold;
                    const displayPrice = ticketPrice || competition.pricePerTicket;

                    return (
                      <div
                        key={competition.id}
                        className="p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold mb-1 flex items-center gap-2">
                              {competition.title}
                              <span
                                className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                  isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-200 text-slate-700"
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
                            <span className="text-muted-foreground">Markers per ticket:</span>
                            <span className="ml-2 font-medium">{competition.markersPerTicket}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price per ticket:</span>
                            <span className="ml-2 font-medium">₹{displayPrice}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max tickets:</span>
                            <span className="ml-2 font-medium">{displayMaxTickets}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className="ml-2 font-medium">{displayRemaining}</span>
                          </div>
                        </div>

                        <div className="border-t pt-3 mt-3">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold text-green-800 mb-1">🧪 Admin Testing Code:</p>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xl font-bold text-green-700 tracking-wider">
                                    999999
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText("999999");
                                      alert("Admin code copied!");
                                    }}
                                    className="text-green-600 hover:text-green-800 p-1"
                                    title="Copy admin code"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-green-600 mt-1">Universal access for testing</p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {typeof competition.finalJudgeX === "number" &&
                          typeof competition.finalJudgeY === "number"
                            ? `Final judged coordinate: (${competition.finalJudgeX.toFixed(3)}, ${competition.finalJudgeY.toFixed(3)})`
                            : "Final judged coordinate pending"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Competition Results</CardTitle>
              <CardDescription>
                Enter judged coordinates and compute winners from the dedicated results page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Use the results workspace to manage final judging, winner computation, and exports.
                </p>
                <Button onClick={() => router.push("/admin/results")}>Open results page</Button>
              </div>
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
                    <label htmlFor="title" className="block text-sm font-medium mb-2">
                      Title
                    </label>
                    <input
                      id="title"
                      value={formState.title}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, title: event.target.value }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="maxEntries" className="block text-sm font-medium mb-2">
                      Max entries
                    </label>
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
                    <label htmlFor="invitePassword" className="block text-sm font-medium mb-2">
                      Invite password
                    </label>
                    <input
                      id="invitePassword"
                      value={formState.invitePassword}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, invitePassword: event.target.value }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium mb-2">
                      Image URL
                    </label>
                    <input
                      id="imageUrl"
                      type="url"
                      value={formState.imageUrl}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="pricePerTicket" className="block text-sm font-medium mb-2">
                      Price per ticket (₹)
                    </label>
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
                    <label htmlFor="markersPerTicket" className="block text-sm font-medium mb-2">
                      Markers per ticket
                    </label>
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
                    <label htmlFor="endsAt" className="block text-sm font-medium mb-2">
                      Ends at (optional)
                    </label>
                    <input
                      id="endsAt"
                      type="datetime-local"
                      value={formState.endsAt}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, endsAt: event.target.value }))
                      }
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
                    {isCreating ? "Creating…" : "Create competition"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showViewDetailsModal && highlightedParticipantId && selectedCompetition && (
          <ViewEntryDetailsModal
            competitionId={selectedCompetition}
            participantId={highlightedParticipantId}
            onClose={() => {
              setShowViewDetailsModal(false);
              setHighlightedParticipantId(null);
            }}
          />
        )}
      </div>
    </main>
  );
}
