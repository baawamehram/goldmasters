'use client';
/* eslint-disable react/no-unescaped-entities */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface Marker {
  id: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  ticketId: string;
  ticketNumber: number;
  color: string;
  label: string;
  locked: boolean;
}

interface TicketMarker {
  id?: string;
  x: number;
  y: number;
}

interface Ticket {
  id: string;
  status: string;
  ticketNumber?: number;
  markersAllowed?: number;
  markersUsed?: number;
  markers?: TicketMarker[];
}

interface MarkerCanvasClientProps {
  imageUrl: string;
  tickets: Ticket[];
  markersPerTicket?: number;
  onMarkersChange: (markers: Marker[]) => void;
  showPanels?: boolean;
}

const TARGET_WIDTH = 960;
const TARGET_HEIGHT = 1280;
const TARGET_RATIO = TARGET_HEIGHT / TARGET_WIDTH;

// Color palette for different tickets
const MARKER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
];

export default function MarkerCanvasClient({
  imageUrl,
  tickets,
  markersPerTicket = 3,
  onMarkersChange,
  showPanels = true,
}: MarkerCanvasClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Marker[]>([]);

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(TARGET_WIDTH);

  const allTicketsLocked = useMemo(
    () => tickets.length > 0 && tickets.every((ticket) => ticket.status !== 'ASSIGNED'),
    [tickets]
  );

  const clampNormalized = useCallback((value: number) => {
    if (Number.isNaN(value)) {
      return 0.5;
    }
    return Math.min(0.98, Math.max(0.02, value));
  }, []);

  const totalMarkersRequired = useMemo(
    () =>
      tickets.reduce(
        (total, ticket) => total + (ticket.markersAllowed ?? markersPerTicket),
        0
      ),
    [markersPerTicket, tickets]
  );

  const buildMarkersFromTickets = useCallback(() => {
    if (!tickets.length) {
      return [] as Marker[];
    }

    const builtMarkers: Marker[] = [];

    tickets.forEach((ticket, ticketIndex) => {
      const color = MARKER_COLORS[ticketIndex % MARKER_COLORS.length];
      const allowed = ticket.markersAllowed ?? markersPerTicket;
      const existingMarkers = ticket.markers ?? [];

      for (let i = 0; i < allowed; i++) {
        const existing = existingMarkers[i];
        const defaultX = clampNormalized(0.35 + ticketIndex * 0.12 + i * 0.06);
        const defaultY = clampNormalized(0.35 + i * 0.12);

        const position = existing
          ? {
              x: clampNormalized(existing.x),
              y: clampNormalized(existing.y),
            }
          : { x: defaultX, y: defaultY };

        const ticketNumber = ticket.ticketNumber ?? ticketIndex + 1;

        builtMarkers.push({
          id: existing?.id ?? `${ticket.id}-marker-${i + 1}`,
          x: position.x,
          y: position.y,
          ticketId: ticket.id,
          ticketNumber,
          color,
          label: `T${ticketNumber}M${i + 1}`,
          locked: ticket.status !== 'ASSIGNED',
        });
      }
    });

    return builtMarkers;
  }, [clampNormalized, markersPerTicket, tickets]);

  useEffect(() => {
    const initialMarkers = buildMarkersFromTickets();
    markersRef.current = initialMarkers;
    setMarkers(initialMarkers);
    onMarkersChange(initialMarkers);
  }, [buildMarkersFromTickets, onMarkersChange]);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  // Load image to confirm availability
  useEffect(() => {
    if (!imageUrl) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  const updateDimensions = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const viewportWidth = window.innerWidth || TARGET_WIDTH;
    const gutter = showPanels ? 32 : 0;
    const minWidth = 280;
    let nextWidth = Math.min(TARGET_WIDTH, Math.max(minWidth, viewportWidth - gutter));

    if (!showPanels) {
      const parentHeight = containerRef.current?.parentElement?.clientHeight ?? window.innerHeight;
      const reservedSpace = 0; // use full height in fullscreen mode
      const maxHeight = parentHeight - reservedSpace;
      if (maxHeight > 0) {
        const widthFromHeight = Math.min(
          TARGET_WIDTH,
          Math.max(minWidth, maxHeight / TARGET_RATIO)
        );
        nextWidth = Math.min(nextWidth, widthFromHeight);
      }
    }

    setContainerWidth(nextWidth);
  }, [showPanels]);

  useEffect(() => {
    updateDimensions();
  }, [updateDimensions]);

  useEffect(() => {
    const handleResize = () => updateDimensions();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateDimensions]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const parent = containerRef.current.parentElement;
    if (!parent) {
      return;
    }

    const observer = new ResizeObserver(() => updateDimensions());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [updateDimensions]);

  const updateMarkerPosition = useCallback(
    (markerId: string, clientX: number, clientY: number) => {
      const rect = imageAreaRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const marker = markersRef.current.find((item) => item.id === markerId);
      if (!marker || marker.locked) {
        return;
      }

      const relativeX = clampNormalized((clientX - rect.left) / rect.width);
      const relativeY = clampNormalized((clientY - rect.top) / rect.height);

      setMarkers((prev) => {
        const next = prev.map((item) =>
          item.id === markerId
            ? { ...item, x: relativeX, y: relativeY }
            : item
        );
        markersRef.current = next;
        onMarkersChange(next);
        return next;
      });
    },
    [clampNormalized, onMarkersChange]
  );

  useEffect(() => {
    if (!draggingId) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateMarkerPosition(draggingId, event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      updateMarkerPosition(draggingId, event.clientX, event.clientY);
      setDraggingId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingId, updateMarkerPosition]);

  const handlePointerDown = (markerId: string) => {
    const marker = markersRef.current.find((item) => item.id === markerId);
    if (!marker || marker.locked) {
      return;
    }
    setDraggingId(markerId);
  };

  const toPixels = useCallback(
    (value: number, axis: 'x' | 'y') => {
      if (!imageAreaRef.current) return 0;
      const rect = imageAreaRef.current.getBoundingClientRect();
      if (axis === 'x') {
        return value * rect.width;
      }
      return value * rect.height;
    },
    []
  );

  const wrapperClass = showPanels
    ? 'flex h-full w-full flex-col gap-4 overflow-y-auto py-6'
    : 'flex h-full w-full items-start justify-center overflow-hidden';

  return (
    <div className={wrapperClass}>
  <div ref={containerRef} className="relative w-full flex items-center justify-center bg-[#101820] overflow-hidden rounded-[32px] shadow-[0_25px_60px_-20px_rgba(10,16,24,0.6)]">
        <div
          ref={imageAreaRef}
          className="relative overflow-hidden border border-slate-200"
          style={{ 
            width: `${containerWidth}px`,
            height: `${containerWidth * TARGET_RATIO}px`,
            maxWidth: '100%'
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Competition"
              className="block w-full h-full"
              draggable={false}
              style={{ 
                touchAction: 'none',
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              No phase image available
            </div>
          )}

          {/* Marker layer */}
          {markers.map((marker) => {
            const left = toPixels(marker.x, 'x');
            const top = toPixels(marker.y, 'y');
            return (
              <button
                key={marker.id}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                style={{
                  left,
                  top,
                  width: 32,
                  height: 32,
                  backgroundColor: marker.color,
                  opacity: marker.locked ? 0.65 : 1,
                  touchAction: 'none',
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  handlePointerDown(marker.id);
                }}
                onClick={(event) => event.preventDefault()}
              >
                <span className="block text-[10px] font-semibold leading-[10px] text-white">
                  {marker.label}
                </span>
              </button>
            );
          })}

          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white text-sm">
              Loading image...
            </div>
          )}

          {allTicketsLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-center text-xs font-semibold text-white">
              All assigned tickets have been submitted. Marker positions are read-only.
            </div>
          )}
        </div>
      </div>

      {/* Marker Legend */}
      {showPanels && (
        <>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Your Markers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tickets.map((ticket, ticketIndex) => {
                const ticketMarkers = markers.filter((m) => m.ticketId === ticket.id);
                const color = MARKER_COLORS[ticketIndex % MARKER_COLORS.length];
                const markersAllowed = ticket.markersAllowed ?? markersPerTicket;
                const isLocked = ticket.status !== 'ASSIGNED';

                return (
                  <div key={ticket.id} className="flex items-start gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">
                        Ticket {ticket.ticketNumber ?? ticketIndex + 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        Markers: {ticketMarkers.length} of {markersAllowed}
                      </p>
                      <p className="text-[11px] mt-1">
                        Status:{' '}
                        <span
                          className={
                            isLocked
                              ? 'text-red-500 font-medium'
                              : 'text-green-600 font-medium'
                          }
                        >
                          {isLocked ? 'Submitted' : 'Pending'}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">📍 How to place markers:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Drag</strong> the colored circles to mark where you think the ball is</li>
              <li>• Each ticket has {markersPerTicket} markers unless stated otherwise</li>
              <li>• Different colors represent different tickets</li>
              <li>• Total markers available: {totalMarkersRequired}</li>
              <li>• Submitted tickets show as <span className="font-semibold">"Submitted"</span> and cannot be moved</li>
              <li>• Position your markers precisely — accuracy matters!</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
