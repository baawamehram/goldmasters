"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildApiUrl } from "@/lib/api";

type CheckoutData = {
  competitionId: string;
  participantId: string;
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
};

type ParticipantData = {
  id: string;
  name: string;
  phone: string;
  competitionId: string;
  accessCode: string;
  createdAt: string;
};

export default function UserViewPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("admin_token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch participant data
        const participantResponse = await fetch(
          buildApiUrl(`admin/participants`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (participantResponse.ok) {
          const participantData = await participantResponse.json();
          const foundParticipant = participantData.data?.find(
            (p: ParticipantData) => p.id === userId
          );
          if (foundParticipant) {
            setParticipant(foundParticipant);
          }
        }

        // Fetch checkout data
        const checkoutResponse = await fetch(
          buildApiUrl(`competitions/${userId}/checkout-summary/${userId}`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (checkoutResponse.ok) {
          const checkoutDataResponse = await checkoutResponse.json();
          if (checkoutDataResponse.summary) {
            setCheckoutData(checkoutDataResponse.summary);
          } else if (checkoutDataResponse.data) {
            setCheckoutData(checkoutDataResponse.data);
          } else {
            setError("No checkout data found for this user");
          }
        } else {
          setError("No checkout data found for this user");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading user details...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !checkoutData) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => router.push("/admin/entries")}
            className="mb-6"
            variant="outline"
          >
            ← Back to Entries
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-600 text-lg">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => router.push("/admin/entries")}
            variant="outline"
          >
            ← Back to Entries
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* User Info Card */}
        {participant && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border border-gray-300 inline-block">
                    {participant.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{participant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{participant.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Access Code</p>
                  <p className="font-mono">{participant.accessCode || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkout Data Card */}
        {checkoutData ? (
          <Card>
            <CardHeader>
              <CardTitle>Checkout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Competition Info */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2">Competition</h3>
                  <div className="flex items-start gap-4">
                    {checkoutData.competition.imageUrl && (
                      <img
                        src={checkoutData.competition.imageUrl}
                        alt={checkoutData.competition.title}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-semibold">
                        {checkoutData.competition.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price per ticket: £{checkoutData.competition.pricePerTicket}
                      </p>
                      <p className="text-sm text-gray-600">
                        Markers per ticket: {checkoutData.competition.markersPerTicket}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 border-b pb-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {checkoutData.tickets.length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Total Markers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {checkoutData.totalMarkers}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Checkout Time</p>
                    <p className="text-sm font-semibold text-purple-600">
                      {formatDate(checkoutData.checkoutTime)}
                    </p>
                  </div>
                </div>

                {/* Tickets with Markers */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Tickets & Marker Placements
                  </h3>
                  <div className="space-y-4">
                    {checkoutData.tickets.map((ticket, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-lg">
                                Ticket #{ticket.ticketNumber}
                              </p>
                              <p className="text-sm text-gray-600">
                                {ticket.markerCount} marker{ticket.markerCount !== 1 ? "s" : ""} placed
                              </p>
                            </div>
                          </div>

                          {ticket.markers.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Marker Coordinates:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {ticket.markers.map((marker, markerIndex) => (
                                  <div
                                    key={markerIndex}
                                    className="bg-gray-50 p-3 rounded border border-gray-200"
                                  >
                                    <p className="font-semibold text-sm mb-1">
                                      {marker.label || `Marker ${markerIndex + 1}`}
                                    </p>
                                    <div className="flex gap-4 text-xs text-gray-600">
                                      <span>
                                        <span className="font-semibold">X:</span>{" "}
                                        {marker.x.toFixed(2)}
                                      </span>
                                      <span>
                                        <span className="font-semibold">Y:</span>{" "}
                                        {marker.y.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Position: {(marker.x * 100).toFixed(1)}%,{" "}
                                      {(marker.y * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">No checkout data available for this user.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
