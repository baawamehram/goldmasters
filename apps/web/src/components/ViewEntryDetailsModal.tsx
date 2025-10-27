"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";

interface StoredMarker {
  id: string;
  x: number;
  y: number;
}

interface Submission {
  id: string;
  ticketNumber: number;
  status: string;
  markersAllowed: number;
  markersUsed: number;
  markers: StoredMarker[];
  submittedAt?: string;
}

interface ParticipantData {
  id: string;
  name: string;
  phone: string;
  ticketsPurchased: number;
}

interface CompetitionData {
  id: string;
  title: string;
  imageUrl: string;
  markersPerTicket: number;
  finalJudgeX?: number | null;
  finalJudgeY?: number | null;
}

interface CheckoutData {
  competitionId: string;
  competition: {
    id: string;
    title: string;
    imageUrl: string;
    pricePerTicket: number;
    markersPerTicket: number;
    status: string;
  };
  participant: {
    id: string;
    name: string;
    phone: string;
    ticketsPurchased: number;
  };
  tickets: Array<{
    ticketNumber: number;
    markerCount: number;
    markers: Array<{
      id: string;
      x: number;
      y: number;
      label: string;
    }>;
  }>;
  totalMarkers: number;
  checkoutTime: string;
}

interface ViewEntryDetailsModalProps {
  competitionId: string;
  participantId: string;
  onClose: () => void;
}

export default function ViewEntryDetailsModal({
  competitionId,
  participantId,
  onClose,
}: ViewEntryDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [competition, setCompetition] = useState<CompetitionData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'checkout'>('submissions');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("admin_token");
        if (!token) {
          throw new Error("Admin not authenticated");
        }

        // Use admin-specific endpoint
        const response = await fetch(
          buildApiUrl(`admin/competitions/${competitionId}/participants/${participantId}/submissions`),
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to load submission details");
        }

        const data = await response.json();
        
        if (data.data) {
          setParticipant(data.data.participant);
          setCompetition(data.data.competition);
          setSubmissions(data.data.submissions || []);
        }

        // Try to load checkout data
        try {
          const checkoutResponse = await fetch(
            buildApiUrl(`competitions/${competitionId}/checkout-summary/${participantId}`),
            {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            }
          );

          if (checkoutResponse.ok) {
            const checkoutDataResponse = await checkoutResponse.json();
            if (checkoutDataResponse.data) {
              setCheckoutData(checkoutDataResponse.data);
            }
          }
        } catch (checkoutErr) {
          console.warn("Could not load checkout data:", checkoutErr);
        }
      } catch (err) {
        console.error("Error fetching submission details:", err);
        setError(err instanceof Error ? err.message : "Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [competitionId, participantId]);

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getClosestMarker = () => {
    if (!competition || competition.finalJudgeX === null || competition.finalJudgeX === undefined || competition.finalJudgeY === null || competition.finalJudgeY === undefined) {
      return null;
    }

    let closest: { marker: StoredMarker; distance: number; ticket: number } | null = null;

    submissions.forEach((submission) => {
      submission.markers.forEach((marker) => {
        const distance = calculateDistance(
          marker.x,
          marker.y,
          competition.finalJudgeX as number,
          competition.finalJudgeY as number
        );

        if (!closest || distance < closest.distance) {
          closest = {
            marker,
            distance,
            ticket: submission.ticketNumber,
          };
        }
      });
    });

    return closest;
  };

  const closestMarker = getClosestMarker();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#055F3C] to-[#077C4E] text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Entry Details</h2>
            <p className="text-sm text-green-100 mt-1">
              {participant?.name} ({participant?.phone})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-flex animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-2"></div>
              <p className="text-gray-600">Loading entry details...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Tab Navigation */}
              {checkoutData && (
                <div className="flex gap-2 border-b">
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      activeTab === 'submissions'
                        ? 'border-b-2 border-brand-primary text-brand-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Submissions
                  </button>
                  <button
                    onClick={() => setActiveTab('checkout')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      activeTab === 'checkout'
                        ? 'border-b-2 border-brand-primary text-brand-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Checkout Summary
                  </button>
                </div>
              )}

              {/* Checkout Tab */}
              {activeTab === 'checkout' && checkoutData && (
                <>
                  <div className="space-y-4">
                    {/* Checkout Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Competition</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{checkoutData.competition.title}</p>
                        <p className="text-sm text-gray-600 mt-1">Status: {checkoutData.competition.status}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Tickets</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{checkoutData.tickets.length}</p>
                        <p className="text-sm text-gray-600 mt-1">{checkoutData.totalMarkers} markers</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Markers Per Ticket</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{checkoutData.competition.markersPerTicket}</p>
                        <p className="text-sm text-gray-600 mt-1">Configured</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Entry Value</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">
                          ₹{checkoutData.competition.pricePerTicket * checkoutData.tickets.length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Total value</p>
                      </div>
                    </div>

                    {/* Tickets and Markers Breakdown */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Marker Breakdown</h3>
                      {checkoutData.tickets.map((ticket) => (
                        <div
                          key={`ticket-${ticket.ticketNumber}`}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Ticket #{ticket.ticketNumber}</h4>
                            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                              {ticket.markerCount} marker{ticket.markerCount > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ticket.markers.map((marker, index) => (
                              <div key={marker.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <p className="text-sm font-semibold text-gray-900 mb-2">{marker.label}</p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">X (norm):</dt>
                                    <dd className="font-mono font-semibold">{marker.x.toFixed(4)}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Y (norm):</dt>
                                    <dd className="font-mono font-semibold">{marker.y.toFixed(4)}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">X (%):</dt>
                                    <dd className="font-mono text-gray-700">{(marker.x * 100).toFixed(2)}%</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Y (%):</dt>
                                    <dd className="font-mono text-gray-700">{(marker.y * 100).toFixed(2)}%</dd>
                                  </div>
                                </dl>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Checkout Time */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        Checkout completed on:{' '}
                        <span className="font-semibold text-gray-900">
                          {new Date(checkoutData.checkoutTime).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Submissions Tab */}
              {activeTab === 'submissions' && (
                <>
                  {/* Participant & Competition Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
                    Participant Info
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600">Name</dt>
                      <dd className="font-semibold text-gray-900">{participant?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Phone</dt>
                      <dd className="font-semibold text-gray-900">{participant?.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Tickets Purchased</dt>
                      <dd className="font-semibold text-gray-900">{participant?.ticketsPurchased}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
                    Competition Info
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600">Title</dt>
                      <dd className="font-semibold text-gray-900">{competition?.title}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Markers per Ticket</dt>
                      <dd className="font-semibold text-gray-900">{competition?.markersPerTicket}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Total Submissions</dt>
                      <dd className="font-semibold text-gray-900">{submissions.length}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Judging Info */}
              {competition &&
                competition.finalJudgeX !== null &&
                competition.finalJudgeX !== undefined &&
                competition.finalJudgeY !== null &&
                competition.finalJudgeY !== undefined && (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-900 font-semibold mb-3">
                      🎯 Final Judged Coordinates
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-800">X Coordinate</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {(competition.finalJudgeX as number).toFixed(4)}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {((competition.finalJudgeX as number) * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-800">Y Coordinate</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {(competition.finalJudgeY as number).toFixed(4)}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {((competition.finalJudgeY as number) * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {closestMarker && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-blue-900 font-semibold mb-2">Closest Marker:</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-blue-700">Ticket #{(closestMarker as any).ticket}</span>
                          </div>
                          <div>
                            <span className="text-blue-700">
                              Marker: ({(closestMarker as any).marker.x.toFixed(4)}, {(closestMarker as any).marker.y.toFixed(4)})
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-green-700">
                              Distance: {(closestMarker as any).distance.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Submissions Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Marker Submissions</h3>
                {submissions.length === 0 ? (
                  <p className="text-gray-600 text-sm">No markers submitted yet</p>
                ) : (
                  submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900">
                          Ticket #{submission.ticketNumber}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                          {submission.markersUsed} of {submission.markersAllowed} markers
                        </span>
                      </div>

                      {submission.submittedAt && (
                        <p className="text-xs text-gray-600 mb-3">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      )}

                      <div className="grid gap-3">
                        {submission.markers.map((marker, index) => (
                          <div
                            key={marker.id}
                            className="bg-white rounded p-3 border border-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
                                  Marker {index + 1}
                                </p>
                                <dl className="mt-2 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">X (Normalized):</dt>
                                    <dd className="font-mono font-semibold text-gray-900">
                                      {marker.x.toFixed(4)}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Y (Normalized):</dt>
                                    <dd className="font-mono font-semibold text-gray-900">
                                      {marker.y.toFixed(4)}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">X (%):</dt>
                                    <dd className="font-mono text-gray-700">
                                      {(marker.x * 100).toFixed(2)}%
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Y (%):</dt>
                                    <dd className="font-mono text-gray-700">
                                      {(marker.y * 100).toFixed(2)}%
                                    </dd>
                                  </div>
                                </dl>
                              </div>

                              {competition &&
                                competition.finalJudgeX !== null &&
                                competition.finalJudgeX !== undefined &&
                                competition.finalJudgeY !== null &&
                                competition.finalJudgeY !== undefined && (
                                  <div className="text-right">
                                    <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
                                      Distance
                                    </p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                      {calculateDistance(
                                        marker.x,
                                        marker.y,
                                        competition.finalJudgeX as number,
                                        competition.finalJudgeY as number
                                      ).toFixed(4)}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
