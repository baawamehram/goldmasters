"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Phase {
  id: number;
  name: string;
  maxMembers: number;
  currentMembers: number;
  status: 'NOT_STARTED' | 'ACTIVE' | 'CLOSED';
  startedAt: string | null;
  closedAt: string | null;
  imageUrl: string | null;
}

export default function PhaseManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadPhases();
  }, [router]);

  const loadPhases = () => {
    // Load phase settings from localStorage
    const phase1Max = parseInt(localStorage.getItem('admin_phase1_max_members') || '55', 10);
    const phase2Max = parseInt(localStorage.getItem('admin_phase2_max_members') || '88', 10);
    const phase3Max = parseInt(localStorage.getItem('admin_phase3_max_members') || '111', 10);

    // Load phase status from localStorage
    const phase1Status = (localStorage.getItem('admin_phase1_status') as Phase['status']) || 'NOT_STARTED';
    const phase2Status = (localStorage.getItem('admin_phase2_status') as Phase['status']) || 'NOT_STARTED';
    const phase3Status = (localStorage.getItem('admin_phase3_status') as Phase['status']) || 'NOT_STARTED';

    const phase1StartedAt = localStorage.getItem('admin_phase1_started_at');
    const phase2StartedAt = localStorage.getItem('admin_phase2_started_at');
    const phase3StartedAt = localStorage.getItem('admin_phase3_started_at');

    const phase1ClosedAt = localStorage.getItem('admin_phase1_closed_at');
    const phase2ClosedAt = localStorage.getItem('admin_phase2_closed_at');
    const phase3ClosedAt = localStorage.getItem('admin_phase3_closed_at');

    // Load current member counts (you can fetch from API in real implementation)
    const phase1Members = parseInt(localStorage.getItem('admin_phase1_current_members') || '0', 10);
    const phase2Members = parseInt(localStorage.getItem('admin_phase2_current_members') || '0', 10);
    const phase3Members = parseInt(localStorage.getItem('admin_phase3_current_members') || '0', 10);

    // Load phase images
    const phase1Image = localStorage.getItem('admin_phase1_image_url');
    const phase2Image = localStorage.getItem('admin_phase2_image_url');
    const phase3Image = localStorage.getItem('admin_phase3_image_url');

    setPhases([
      {
        id: 1,
        name: 'Phase 1',
        maxMembers: phase1Max,
        currentMembers: phase1Members,
        status: phase1Status,
        startedAt: phase1StartedAt,
        closedAt: phase1ClosedAt,
        imageUrl: phase1Image,
      },
      {
        id: 2,
        name: 'Phase 2',
        maxMembers: phase2Max,
        currentMembers: phase2Members,
        status: phase2Status,
        startedAt: phase2StartedAt,
        closedAt: phase2ClosedAt,
        imageUrl: phase2Image,
      },
      {
        id: 3,
        name: 'Phase 3',
        maxMembers: phase3Max,
        currentMembers: phase3Members,
        status: phase3Status,
        startedAt: phase3StartedAt,
        closedAt: phase3ClosedAt,
        imageUrl: phase3Image,
      },
    ]);

    setIsLoading(false);
  };

  const handleStartPhase = (phaseId: number) => {
    setMessage(null);
    
    try {
      const phase = phases.find(p => p.id === phaseId);
      if (!phase) return;

      if (phase.status === 'ACTIVE') {
        setMessage({ type: 'error', text: `${phase.name} is already active` });
        return;
      }

      if (phase.status === 'CLOSED') {
        setMessage({ type: 'error', text: `${phase.name} is already closed. Cannot reopen.` });
        return;
      }

      // Update status
      localStorage.setItem(`admin_phase${phaseId}_status`, 'ACTIVE');
      localStorage.setItem(`admin_phase${phaseId}_started_at`, new Date().toISOString());

      setMessage({ type: 'success', text: `${phase.name} started successfully!` });
      loadPhases();
    } catch (error) {
      console.error('Error starting phase:', error);
      setMessage({ type: 'error', text: 'Failed to start phase' });
    }
  };

  const handleClosePhase = (phaseId: number) => {
    setMessage(null);
    
    try {
      const phase = phases.find(p => p.id === phaseId);
      if (!phase) return;

      if (phase.status === 'NOT_STARTED') {
        setMessage({ type: 'error', text: `${phase.name} hasn't started yet` });
        return;
      }

      if (phase.status === 'CLOSED') {
        setMessage({ type: 'error', text: `${phase.name} is already closed` });
        return;
      }

      // Confirm before closing
      if (!confirm(`Are you sure you want to close ${phase.name}?`)) {
        return;
      }

      // Update status
      localStorage.setItem(`admin_phase${phaseId}_status`, 'CLOSED');
      localStorage.setItem(`admin_phase${phaseId}_closed_at`, new Date().toISOString());

      setMessage({ type: 'success', text: `${phase.name} closed successfully!` });
      loadPhases();
    } catch (error) {
      console.error('Error closing phase:', error);
      setMessage({ type: 'error', text: 'Failed to close phase' });
    }
  };

  const handleReopenPhase = (phaseId: number) => {
    setMessage(null);
    
    try {
      const phase = phases.find(p => p.id === phaseId);
      if (!phase) return;

      if (phase.status !== 'CLOSED') {
        setMessage({ type: 'error', text: `${phase.name} is not closed` });
        return;
      }

      // Confirm before reopening
      if (!confirm(`Are you sure you want to reopen ${phase.name}?`)) {
        return;
      }

      // Update status back to NOT_STARTED so admin needs to start it again
      localStorage.setItem(`admin_phase${phaseId}_status`, 'NOT_STARTED');
      localStorage.removeItem(`admin_phase${phaseId}_started_at`);
      localStorage.removeItem(`admin_phase${phaseId}_closed_at`);

      setMessage({ type: 'success', text: `${phase.name} reopened! Click "Start Phase" to activate it.` });
      loadPhases();
    } catch (error) {
      console.error('Error reopening phase:', error);
      setMessage({ type: 'error', text: 'Failed to reopen phase' });
    }
  };

  const getJudgementRoute = (phaseId: number) => {
    switch (phaseId) {
      case 1:
        return '/admin/phases/phase-1/judgement-round';
      case 2:
        return '/admin/phases/phase-2/judgement-round';
      case 3:
        return '/admin/phases/phase-3/judgement-round';
      default:
        return '/admin/phases';
    }
  };

  const handleJudgementRound = (phaseId: number) => {
    router.push(getJudgementRoute(phaseId));
  };

  const handleImageUpload = (phaseId: number, imageUrl: string) => {
    try {
      localStorage.setItem(`admin_phase${phaseId}_image_url`, imageUrl);
      setMessage({ type: 'success', text: `Image updated for Phase ${phaseId}!` });
      loadPhases();
    } catch (error) {
      console.error('Error updating image:', error);
      setMessage({ type: 'error', text: 'Failed to update image' });
    }
  };

  const handleImageFile = (phaseId: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      handleImageUpload(phaseId, base64Image);
    };
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read image file' });
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  const getStatusBadge = (status: Phase['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Not Started</span>;
      case 'ACTIVE':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Active
        </span>;
      case 'CLOSED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Closed</span>;
    }
  };

  const getPhaseColor = (phaseId: number) => {
    switch (phaseId) {
      case 1: return 'green';
      case 2: return 'blue';
      case 3: return 'purple';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading phases...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5 py-8 px-4">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Phase Management</h1>
            <p className="text-muted-foreground mt-1">Control competition phases and member limits</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/settings')}>
              Settings
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/results')}>
              Results
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              Dashboard
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Phases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {phases.map((phase) => {
            const color = getPhaseColor(phase.id);
            
            return (
              <Card key={phase.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-${color}-600`}>{phase.name}</CardTitle>
                    {getStatusBadge(phase.status)}
                  </div>
                  <CardDescription>
                    Competition Phase {phase.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Timestamps */}
                  <div className="space-y-2 text-sm border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Started:</span>
                      <span className="text-gray-900">{formatDate(phase.startedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Closed:</span>
                      <span className="text-gray-900">{formatDate(phase.closedAt)}</span>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2 border-t pt-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase">
                      Competition Image
                    </label>
                    <div 
                      className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-brand-primary transition-colors cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-brand-primary', 'bg-brand-primary/5');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-brand-primary', 'bg-brand-primary/5');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-brand-primary', 'bg-brand-primary/5');
                        const file = e.dataTransfer.files[0];
                        if (file) handleImageFile(phase.id, file);
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFile(phase.id, file);
                        }}
                      />
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-xs text-gray-600">
                          <span className="font-semibold text-brand-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                    {phase.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border-2 border-gray-200 relative group">
                        <img 
                          src={phase.imageUrl} 
                          alt={`${phase.name} competition`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          onClick={() => {
                            if (confirm('Remove this image?')) {
                              handleImageUpload(phase.id, '');
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {phase.status === 'NOT_STARTED' && (
                      <Button
                        onClick={() => handleStartPhase(phase.id)}
                        className="flex-1"
                        size="sm"
                      >
                        Start Phase
                      </Button>
                    )}
                    {phase.status === 'ACTIVE' && (
                      <Button
                        onClick={() => handleClosePhase(phase.id)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        Close Phase
                      </Button>
                    )}
                    {phase.status === 'CLOSED' && (
                      <>
                        <Button
                          onClick={() => handleJudgementRound(phase.id)}
                          className="flex-1"
                          size="sm"
                        >
                          Judgement Round
                        </Button>
                        <Button
                          onClick={() => handleReopenPhase(phase.id)}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          Reopen Phase
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Phase System Information</CardTitle>
            <CardDescription>How the multi-phase competition system works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold">Phase 1 - First Competition</p>
                  <p className="text-gray-600">Limited to {phases[0]?.maxMembers} participants. First phase of the competition event.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold">Phase 2 - Second Competition</p>
                  <p className="text-gray-600">Limited to {phases[1]?.maxMembers} participants. Second phase of the competition event.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold">Phase 3 - Final Competition</p>
                  <p className="text-gray-600">Limited to {phases[2]?.maxMembers} participants. Final phase of the competition event.</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Member limits can be changed in the Settings page. Closed phases can be reopened using the "Reopen Phase" button.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
