"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Participant {
  id: string;
  participantId: string | null;
  competitionId: string | null;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  assignedTickets: number;
  ticketsPurchased: number;
  isLoggedIn: boolean;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  accessCode: string;
  currentPhase: number | null;
}

export default function AdminEntriesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxTicketsPerParticipant, setMaxTicketsPerParticipant] = useState(5);
  const [assigningTickets, setAssigningTickets] = useState<string | null>(null);
  const [ticketAssignmentCount, setTicketAssignmentCount] = useState<{[key: string]: number}>({});
  const [newUserIds, setNewUserIds] = useState<Set<string>>(new Set());
  const [newUserNotification, setNewUserNotification] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [creatingEntry, setCreatingEntry] = useState(false);
  const [createEntryError, setCreateEntryError] = useState<string | null>(null);
  const [newEntryName, setNewEntryName] = useState("");
  const [newEntryPhone, setNewEntryPhone] = useState("");
  const [newEntryEmail, setNewEntryEmail] = useState("");
  const [newEntryTickets, setNewEntryTickets] = useState("0");
  const [newEntryUserId, setNewEntryUserId] = useState("");

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load max tickets setting
    const savedMaxTickets = localStorage.getItem('admin_max_tickets_per_participant');
    if (savedMaxTickets) {
      setMaxTicketsPerParticipant(parseInt(savedMaxTickets, 10));
    }

    loadParticipants();

    // Set up real-time polling every 2 seconds
    const pollInterval = setInterval(() => {
      loadParticipants(true); // Silent reload
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [router]);

  const loadParticipants = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/v1/admin/participants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load participants');
      }

      const data = await response.json();
      const newParticipants = data.data || [];
      
      // Detect new users
      if (participants.length > 0) {
        const existingIds = new Set(participants.map(p => p.id));
        const freshUserIds = new Set<string>();
        const newUserNames: string[] = [];
        
        newParticipants.forEach((p: Participant) => {
          if (!existingIds.has(p.id)) {
            freshUserIds.add(p.id);
            newUserNames.push(p.name);
          }
        });
        
        if (freshUserIds.size > 0) {
          setNewUserIds(freshUserIds);
          setNewUserNotification(`🎉 ${newUserNames.join(', ')} just joined!`);
          
          // Play a subtle notification sound
          if (typeof Audio !== 'undefined') {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnn77RgGwU7k9r0yoUoBS18zu/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z3I4+CRZpvfLmmE0MDU6l5O+zYBoGPJLZ8sp+KwYuf87v45ZDDBJesurzrVoXCEWc3POzayEFLoTP89qLOAkXa7zy5ZdOCw1Opd/vsWIbBTyS2fLHeCgGLX3O7+OVRA0SXrPq7rBeGQdGnNvys2shBS+Ez/PaizsJGGy88uOVTwwLTqbe77JiGgY8kdnyxnYpBSt+zO7hlUQMEl6z6u6wXhkHR5za8rNrIAUvhM/z2Yo7CRhtvPLjlE8MC06l3++yYhsGPJHY8sV1KgYrfszu4ZVEDBJes+rvr14aB0ec2vKzax8FMYXQROdG8eePCw');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          }
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setNewUserIds(new Set());
            setNewUserNotification(null);
          }, 3000);
        }
      }
      
      setParticipants(newParticipants);
    } catch (error) {
      console.error('Error loading participants:', error);
      if (!silent) {
        setError(error instanceof Error ? error.message : 'Failed to load participants');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  const handleAssignTickets = async (participantId: string, count: number) => {
    if (count < 0 || count > maxTicketsPerParticipant) {
      alert(`Tickets must be between 0 and ${maxTicketsPerParticipant}`);
      return;
    }

    setAssigningTickets(participantId);
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/v1/admin/users/${participantId}/assign-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ticketCount: count }),
      });

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      let payload: any = null;
      let fallbackMessage: string | null = null;

      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        fallbackMessage = await response.text();
      }

      if (!response.ok) {
        const message =
          (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
            ? payload.message
            : null) ||
          (fallbackMessage && fallbackMessage.trim().length > 0 ? fallbackMessage : null) ||
          `Failed to assign tickets (HTTP ${response.status})`;
        throw new Error(message);
      }

      const successfulPayload =
        payload && typeof payload === 'object' && 'data' in payload && payload.data
          ? (payload.data as Partial<Participant>)
          : null;
      const updatedTicketCount =
        typeof successfulPayload?.assignedTickets === 'number'
          ? successfulPayload.assignedTickets
          : count;
      const participantName = participants.find((p) => p.id === participantId)?.name ?? 'participant';

      // Update the participant's ticket count in state
      setParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? { ...p, assignedTickets: updatedTicketCount }
          : p
      ));
      setTicketAssignmentCount(prev => ({
        ...prev,
        [participantId]: updatedTicketCount,
      }));

      // Show success message
      setAssigningTickets(null);
      setSuccessNotification(`✅ Successfully assigned ${updatedTicketCount} tickets to ${participantName}!`);
      setTimeout(() => setSuccessNotification(null), 3000);
      
      // Reload to confirm update
      loadParticipants(true);
    } catch (error) {
      console.error('Error assigning tickets:', error);
      setAssigningTickets(null);
      setErrorNotification(error instanceof Error ? error.message : 'Failed to assign tickets. Please try again.');
      setTimeout(() => setErrorNotification(null), 5000);
    }
  };

  // Filter participants by search query
  const filteredParticipants = participants.filter((participant) => {
    const query = searchQuery.toLowerCase();
    return (
      participant.name.toLowerCase().includes(query) ||
      participant.phone.includes(query) ||
      participant.email?.toLowerCase().includes(query)
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const isAllSelected = filteredParticipants.every(p => prev.has(p.id));
      if (isAllSelected) {
        const next = new Set(prev);
        filteredParticipants.forEach(p => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      filteredParticipants.forEach(p => next.add(p.id));
      return next;
    });
  };

  const deleteParticipants = async (toDelete: Participant[]) => {
    if (toDelete.length === 0) return;
    
    const confirmed = window.confirm(
      `Delete ${toDelete.length} participant(s)? This will remove their entries and checkout data. This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const payload = {
        participants: toDelete.map(p => ({
          competitionId: p.competitionId ?? undefined,
          participantId: p.participantId ?? undefined,
          userId: p.id,
        })),
      };

      console.log(`[Entries Page] Attempting to delete ${toDelete.length} participants:`, toDelete.map(p => p.id));

      const response = await fetch('/api/v1/admin/participants', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as unknown;
      
      console.log(`[Entries Page] Delete response status: ${response.status}`, data);

      if (!response.ok) {
        const errorData = data as { message?: string } | null;
        const errorMessage = errorData?.message || `HTTP ${response.status}: Failed to delete`;
        throw new Error(errorMessage);
      }

      console.log(`[Entries Page] Successfully deleted ${toDelete.length} participants`);

      const deletedIds = new Set<string>(toDelete.map(p => p.id));
      setParticipants(prev => prev.filter(p => !deletedIds.has(p.id)));
      setSelectedIds(new Set());
      setSuccessNotification(`🗑️ Deleted ${toDelete.length} participant(s).`);
      setTimeout(() => setSuccessNotification(null), 3000);
    } catch (error) {
      console.error('[Entries Page] Error deleting participants:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete participants';
      setErrorNotification(errorMsg);
      setTimeout(() => setErrorNotification(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetNewEntryForm = () => {
    setNewEntryName("");
    setNewEntryPhone("");
    setNewEntryEmail("");
    setNewEntryTickets("0");
    setNewEntryUserId("");
    setCreateEntryError(null);
  };

  const handleCreateEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creatingEntry) {
      return;
    }

    setCreateEntryError(null);

    const trimmedName = newEntryName.trim();
    const trimmedPhone = newEntryPhone.trim();
    const trimmedEmail = newEntryEmail.trim();
    const trimmedUserId = newEntryUserId.trim();

    if (!trimmedName) {
      setCreateEntryError('Name is required');
      return;
    }

    if (!trimmedPhone) {
      setCreateEntryError('Phone number is required');
      return;
    }

    const rawTickets = Number.parseInt(newEntryTickets, 10);
    if (Number.isNaN(rawTickets) || rawTickets < 0) {
      setCreateEntryError('Initial tickets must be zero or a positive number');
      return;
    }

    const limitedTickets = Math.min(rawTickets, maxTicketsPerParticipant);
    if (limitedTickets !== rawTickets) {
      setNewEntryTickets(String(limitedTickets));
    }

    setCreatingEntry(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/v1/admin/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail || undefined,
          initialTickets: limitedTickets,
          userId: trimmedUserId || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload.status !== 'success') {
        const message = payload?.message || 'Failed to create participant entry';
        throw new Error(message);
      }

      const createdParticipant = payload.data as { id: string; name?: string; accessCode?: string };

      resetNewEntryForm();

      if (createdParticipant?.name) {
        const parts = [`🎉 Created entry for ${createdParticipant.name}`];
        if (createdParticipant.accessCode) {
          parts.push(`Access code: ${createdParticipant.accessCode}`);
        }
        setSuccessNotification(parts.join(' - '));
        setTimeout(() => setSuccessNotification(null), 4000);
      }

      await loadParticipants(true);
    } catch (creationError) {
      console.error('Error creating participant entry:', creationError);
      const message = creationError instanceof Error ? creationError.message : 'Failed to create participant entry';
      setCreateEntryError(message);
    } finally {
      setCreatingEntry(false);
    }
  };

  const loadingView = (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading entries...</p>
      </div>
    </main>
  );

  if (isLoading) {
    return loadingView;
  }

  return (
    <Suspense fallback={loadingView}>
      <main className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5 py-8 px-4">
      {/* New User Notification Toast */}
      {newUserNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border-2 border-green-400">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </div>
            <span className="font-semibold text-lg">{newUserNotification}</span>
          </div>
        </div>
      )}
      
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-heading">Participant Entries</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold text-green-700">Live Updates</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1">
              All users who have logged in ({participants.length} total)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/settings')}>
              Settings
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              Dashboard
            </Button>
            <Button
              variant="destructive"
              disabled={selectedIds.size === 0 || isDeleting}
              onClick={() => {
                const items = participants.filter(p => selectedIds.has(p.id));
                deleteParticipants(items);
              }}
            >
              Delete Selected ({selectedIds.size})
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Search + Manual Entry */}
        <div className="mb-6 space-y-4">
          <Card className="relative overflow-hidden border border-brand-primary/15 shadow-lg shadow-brand-primary/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary/70" />
            <CardHeader className="pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Create Manual Entry</CardTitle>
                  <CardDescription>Register a participant and prepare their credentials</CardDescription>
                </div>
                <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">Manual</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Name</label>
                    <input
                      value={newEntryName}
                      onChange={(event) => setNewEntryName(event.target.value)}
                      placeholder="Participant name"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Phone</label>
                    <input
                      value={newEntryPhone}
                      onChange={(event) => setNewEntryPhone(event.target.value)}
                      placeholder="Enter mobile number"
                      inputMode="tel"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Email <span className="text-gray-400">(optional)</span></label>
                    <input
                      value={newEntryEmail}
                      onChange={(event) => setNewEntryEmail(event.target.value)}
                      placeholder="name@example.com"
                      type="email"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Custom User ID <span className="text-gray-400">(optional)</span></label>
                    <input
                      value={newEntryUserId}
                      onChange={(event) => setNewEntryUserId(event.target.value)}
                      placeholder="Leave blank to auto-generate"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Initial Tickets</label>
                    <input
                      type="number"
                      min={0}
                      max={maxTicketsPerParticipant}
                      value={newEntryTickets}
                      onChange={(event) => setNewEntryTickets(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                    <p className="text-xs text-gray-500">Assign 0-{maxTicketsPerParticipant} tickets now, or adjust later.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetNewEntryForm}
                    disabled={creatingEntry}
                    className="justify-self-end"
                  >
                    Clear
                  </Button>
                </div>

                {createEntryError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {createEntryError}
                  </div>
                )}

                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-brand-primary/20 bg-brand-primary/5 p-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                  <p>We'll auto-generate an access code and keep the participant offline until they log in.</p>
                  <Button type="submit" disabled={creatingEntry} className="sm:w-auto">
                    {creatingEntry ? 'Creating...' : 'Create Entry'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100/80 bg-white/70 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Search Participants</CardTitle>
                <CardDescription>Filter the list by name, phone, email, or access code</CardDescription>
              </div>
              <Button onClick={() => loadParticipants(false)} variant="outline" className="w-full sm:w-auto">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search Query
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by name, phone, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-inner focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"> 
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Participants</CardDescription>
              <CardTitle className="text-3xl">{participants.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Online Now
                </span>
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {participants.filter(p => p.isLoggedIn).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Max Tickets Per User</CardDescription>
              <CardTitle className="text-3xl">{maxTicketsPerParticipant}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Filtered Results</CardDescription>
              <CardTitle className="text-3xl">{filteredParticipants.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Participant List</CardTitle>
            <CardDescription>All registered participants with their ticket assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? 'No participants found matching your search' : 'No participants registered yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          aria-label="Select all"
                          checked={filteredParticipants.length > 0 && filteredParticipants.every(p => selectedIds.has(p.id))}
                          onChange={toggleSelectAll}
                          disabled={isDeleting}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Access Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Assign Tickets
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Registered At
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredParticipants.map((participant) => {
                      const isNewUser = newUserIds.has(participant.id);
                      const isSelected = selectedIds.has(participant.id);
                      return (
                        <tr
                          key={participant.id}
                          className={`transition-all duration-500 ${
                            isSelected
                              ? 'bg-blue-50 ring-2 ring-blue-300'
                              : isNewUser
                                ? 'bg-green-50 border-l-4 border-l-green-500 animate-pulse'
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-4 text-sm">
                            <input
                              type="checkbox"
                              aria-label={`Select ${participant.name}`}
                              checked={isSelected}
                              onChange={() => toggleSelect(participant.id)}
                              disabled={isDeleting}
                            />
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-300 text-gray-700">
                                {participant.id}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(participant.id);
                                  alert('User ID copied!');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy User ID"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              {isNewUser && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white animate-bounce">
                                  NEW
                                </span>
                              )}
                              {participant.name}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">{participant.phone}</td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-lg font-bold text-[#055F3C] bg-green-50 px-3 py-1 rounded border-2 border-[#055F3C] tracking-wider">
                                {participant.accessCode}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(participant.accessCode);
                                  alert('Access code copied!');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy code"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    participant.isLoggedIn
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      participant.isLoggedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                    }`}
                                  ></span>
                                  {participant.isLoggedIn ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              {participant.lastLoginAt && (
                                <div className="text-xs text-gray-500">
                                  Last: {formatDate(participant.lastLoginAt)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={maxTicketsPerParticipant}
                                value={ticketAssignmentCount[participant.id] ?? participant.assignedTickets}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setTicketAssignmentCount((prev) => ({
                                    ...prev,
                                    [participant.id]: val,
                                  }));
                                }}
                                className="w-16 px-2 py-1 text-center border-2 border-gray-200 rounded focus:outline-none focus:border-brand-primary"
                                disabled={assigningTickets === participant.id}
                              />
                              <span className="text-xs text-gray-500">/ {maxTicketsPerParticipant}</span>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAssignTickets(
                                    participant.id,
                                    ticketAssignmentCount[participant.id] ?? participant.assignedTickets,
                                  )
                                }
                                disabled={assigningTickets === participant.id}
                                className="text-xs px-2 py-1"
                              >
                                {assigningTickets === participant.id ? '...' : 'Assign'}
                              </Button>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Current: {ticketAssignmentCount[participant.id] ?? participant.assignedTickets}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{formatDate(participant.createdAt)}</td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  router.push(`/admin/entries/${participant.id}/view`);
                                }}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteParticipants([participant])}
                                disabled={isDeleting}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Notification */}
      {successNotification && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-slide-in-right flex items-center gap-3 max-w-md z-50">
          <span className="text-2xl">✅</span>
          <span className="font-medium">{successNotification}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorNotification && (
        <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg animate-slide-in-right flex items-center gap-3 max-w-md z-50">
          <span className="text-2xl">❌</span>
          <span className="font-medium">{errorNotification}</span>
        </div>
      )}

      {/* New User Notification */}
      {newUserNotification && (
        <div className="fixed top-20 right-6 bg-brand-primary text-white px-6 py-4 rounded-lg shadow-lg animate-slide-in-right flex items-center gap-3 max-w-md z-50">
          <span>{newUserNotification}</span>
        </div>
      )}
      </main>
    </Suspense>
  );
}
