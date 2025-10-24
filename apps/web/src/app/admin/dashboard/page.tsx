"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Competition {
  id: string;
  title: string;
  maxEntries: number;
  ticketsSold: number;
  remainingSlots: number;
  status: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [participantId, setParticipantId] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    // Mock competitions data - TODO: Fetch from API
    setCompetitions([
      {
        id: 'test-id',
        title: 'Wishmasters Spot the Ball - October 2025',
        maxEntries: 100,
        ticketsSold: 45,
        remainingSlots: 55,
        status: 'ACTIVE',
      },
    ]);
    setIsLoading(false);
  }, [router]);

  const handleAssignTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsAssigning(true);

    try {
      const token = localStorage.getItem('admin_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(
        `${API_URL}/api/v1/admin/competitions/${selectedCompetition}/assign-tickets`,
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
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
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
                {competitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="font-semibold mb-2">{competition.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tickets Sold:</span>
                        <span className="ml-2 font-medium">{competition.ticketsSold}/{competition.maxEntries}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="ml-2 font-medium">{competition.remainingSlots}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        competition.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {competition.status}
                      </span>
                    </div>
                  </div>
                ))}
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
                    {competitions.map((comp) => (
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
        </div>
      </div>
    </main>
  );
}
