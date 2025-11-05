'use client';
/* eslint-disable react/no-unescaped-entities */

import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

type MarkerState = 'placed' | 'active' | 'pending';

interface Marker {
  id: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  ticketId: string;
  ticketNumber: number;
  color: string;
  label: string;
  locked: boolean;
  isVisible: boolean;
  state: MarkerState;
}

export default forwardRef(MarkerCanvasClient);

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

export interface MarkerCanvasHandle {
  placeCurrentMarker: () => { placed: boolean; hasMore: boolean };
  getActiveMarker: () => Marker | null;
  undoLastPlacement: () => boolean;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface MarkerCanvasClientProps {
  imageUrl: string;
  tickets: Ticket[];
  markersPerTicket?: number;
  onMarkersChange: (markers: Marker[]) => void;
  showPanels?: boolean;
  fitViewport?: boolean;
}

const TARGET_WIDTH = 960;
const TARGET_HEIGHT = 1280;
const TARGET_RATIO = TARGET_HEIGHT / TARGET_WIDTH;

// Color palette for different tickets
export const MARKER_COLORS = [
  '#FF3B30', // Vivid red
  '#0A84FF', // Bright blue
  '#30D158', // Signal green
  '#FF9500', // Modern orange
  '#AF52DE', // Refined purple
  '#64D2FF', // Icy cyan
  '#FFD60A', // Highlight gold
  '#FF2D55', // Punchy pink
];

function MarkerCanvasClient(
  {
    imageUrl,
    tickets,
    markersPerTicket = 3,
    onMarkersChange,
    showPanels = true,
    fitViewport = false,
  }: MarkerCanvasClientProps,
  ref: ForwardedRef<MarkerCanvasHandle>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Marker[]>([]);
  const placementHistoryRef = useRef<Array<{ placedId: string; nextActivatedId: string | null }>>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
    let hasActiveMarker = false;

    tickets.forEach((ticket, ticketIndex) => {
      const color = MARKER_COLORS[ticketIndex % MARKER_COLORS.length];
      const allowed = ticket.markersAllowed ?? markersPerTicket;
      const existingMarkers = ticket.markers ?? [];
      const ticketNumber = ticket.ticketNumber ?? ticketIndex + 1;
      const isAssigned = ticket.status === 'ASSIGNED';

      existingMarkers.forEach((existing, existingIndex) => {
        builtMarkers.push({
          id: existing.id ?? `${ticket.id}-marker-${existingIndex + 1}`,
          x: clampNormalized(existing.x),
          y: clampNormalized(existing.y),
          ticketId: ticket.id,
          ticketNumber,
          color,
          label: `T${ticketNumber}M${existingIndex + 1}`,
          locked: true,
          isVisible: true,
          state: 'placed' as const,
        });
      });

      const remaining = Math.max(allowed - existingMarkers.length, 0);
      for (let i = 0; i < remaining; i++) {
        const markerIndex = existingMarkers.length + i;
        const defaultX = clampNormalized(0.5 + ticketIndex * 0.08 - i * 0.04);
        const defaultY = clampNormalized(0.5 + i * 0.06);

        const isActive = !hasActiveMarker && isAssigned;
        builtMarkers.push({
          id: `${ticket.id}-marker-${markerIndex + 1}`,
          x: defaultX,
          y: defaultY,
          ticketId: ticket.id,
          ticketNumber,
          color,
          label: `T${ticketNumber}M${markerIndex + 1}`,
          locked: !isActive,
          isVisible: !isAssigned ? true : isActive,
          state: (isAssigned ? (isActive ? 'active' : 'pending') : 'placed') as MarkerState,
        });

        if (isActive) {
          hasActiveMarker = true;
        }
      }
    });

    return builtMarkers;
  }, [clampNormalized, markersPerTicket, tickets]);

  useEffect(() => {
    const initialMarkers = buildMarkersFromTickets();

    // Ensure only one active marker is unlocked/visible for placement.
    let nextMarkers = initialMarkers;
    const activeIndex = initialMarkers.findIndex((marker) => marker.state === 'active');
    if (activeIndex === -1) {
      const pendingIndex = initialMarkers.findIndex((marker) => marker.state === 'pending');
      if (pendingIndex !== -1) {
        nextMarkers = initialMarkers.map((marker, index) =>
          index === pendingIndex
            ? { ...marker, locked: false, isVisible: true, state: 'active' as const }
            : marker
        );
      }
    }

    markersRef.current = nextMarkers;
    setMarkers(nextMarkers);
  }, [buildMarkersFromTickets]);

  useEffect(() => {
    markersRef.current = markers;
    onMarkersChange(markers);
  }, [markers, onMarkersChange]);

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

    const shouldFitViewport = !showPanels && fitViewport;

    if (shouldFitViewport) {
      const viewportHeight = window.innerHeight || TARGET_HEIGHT;
      const containerTop = containerRef.current
        ? containerRef.current.getBoundingClientRect().top
        : 0;
      const safetyMargin = 40; // leave space for controls/borders
      const availableHeight = Math.max(
        360,
        viewportHeight - containerTop - safetyMargin
      );

      if (availableHeight > 0) {
        const widthFromHeight = Math.min(
          TARGET_WIDTH,
          Math.max(minWidth, availableHeight / TARGET_RATIO)
        );
        nextWidth = Math.min(nextWidth, widthFromHeight);
      }
    } else if (!showPanels) {
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
  }, [fitViewport, showPanels]);

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
      if (!marker || marker.locked || marker.state !== 'active') {
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
        return next;
      });
    },
    [clampNormalized]
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
    if (!marker || marker.locked || marker.state !== 'active') {
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

  useImperativeHandle(
    ref,
    () => ({
      placeCurrentMarker: () => {
        let placed = false;
        let hasMore = false;

        setMarkers((prev) => {
          const activeIndex = prev.findIndex((marker) => marker.state === 'active');
          if (activeIndex === -1) {
            return prev;
          }

          const placedId = prev[activeIndex]?.id ?? '';

          const updated = prev.map((marker, index) => {
            if (index === activeIndex) {
              placed = true;
              return { ...marker, locked: true, state: 'placed' as const, isVisible: true };
            }
            return marker;
          });

          const nextPendingIndex = updated.findIndex((marker) => marker.state === 'pending');
          if (nextPendingIndex !== -1) {
            hasMore = true;
            const nextActivatedId = updated[nextPendingIndex]?.id ?? null;
            updated[nextPendingIndex] = {
              ...updated[nextPendingIndex],
              locked: false,
              state: 'active' as const,
              isVisible: true,
            };
            // Record history for undo
            placementHistoryRef.current.push({ placedId, nextActivatedId });
          } else {
            // No next marker; still record the placedId with null nextActivatedId
            placementHistoryRef.current.push({ placedId, nextActivatedId: null });
          }

          markersRef.current = updated;
          return updated;
        });

        return { placed, hasMore };
      },
      getActiveMarker: () => {
        return markersRef.current.find((marker) => marker.state === 'active') ?? null;
      },
      undoLastPlacement: () => {
        const history = placementHistoryRef.current;
        if (!history.length) return false;
        const { placedId, nextActivatedId } = history.pop()!;
        let undone = false;

        setMarkers((prev) => {
          const updated = prev.map((m) => {
            if (m.id === placedId && m.state === 'placed') {
              undone = true;
              return { ...m, locked: false, state: 'active' as const, isVisible: true };
            }
            if (nextActivatedId && m.id === nextActivatedId && m.state === 'active') {
              return { ...m, locked: true, state: 'pending' as const, isVisible: true };
            }
            return m;
          });
          markersRef.current = updated;
          return updated;
        });

        return undone;
      },
      zoomIn: () => {
        setZoomLevel((z) => Math.min(3, Math.round((z + 0.5) * 10) / 10));
      },
      zoomOut: () => {
        setZoomLevel((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10));
      },
    })
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
          {markers.filter((marker) => marker.isVisible).map((marker) => {
            const left = toPixels(marker.x, 'x');
            const top = toPixels(marker.y, 'y');
            const isActive = marker.state === 'active';
            const isPlaced = marker.state === 'placed';
            const displayColor = marker.color;
            const accentBorder = isActive ? displayColor : `${displayColor}CC`;
            const accentSoft = `${displayColor}14`;
            const accentOutline = `${displayColor}44`;
            const restingOutline = `${displayColor}26`;
            const size = isActive ? 48 : isPlaced ? 24 : 38;
            const boxShadow = isActive
              ? `0 16px 36px ${displayColor}28, 0 0 0 1px ${displayColor}55`
              : isPlaced
                ? `0 6px 14px rgba(15,23,42,0.25), 0 0 0 1px ${restingOutline}`
                : `0 12px 26px rgba(15,23,42,0.18), 0 0 0 1px ${restingOutline}`;
            const coordX = Math.round(marker.x * 1000) / 10;
            const coordY = Math.round(marker.y * 1000) / 10;
            return (
              <div
                key={marker.id}
                className="absolute"
                style={{
                  left,
                  top,
                  touchAction: 'none',
                  zIndex: isActive ? 30 : 5,
                }}
              >
                <button
                  type="button"
                  className="relative flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-150"
                  style={{
                    cursor: isActive ? 'grab' : 'default',
                    background: isPlaced ? '#0f172a' : accentSoft,
                    border: `1.5px solid ${accentBorder}`,
                    boxShadow,
                    backdropFilter: 'blur(4px)',
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    handlePointerDown(marker.id);
                  }}
                  onClick={(event) => event.preventDefault()}
                >
                  {isPlaced ? (
                    <span
                      className="text-base font-semibold leading-none text-white"
                      style={{ textShadow: `0 0 6px ${displayColor}80` }}
                    >
                      +
                    </span>
                  ) : (
                    <>
                      <span
                        className="absolute rounded-full"
                        style={{
                          inset: '20%',
                          boxShadow: `inset 0 0 0 1px ${accentOutline}`,
                          background: `radial-gradient(circle at center, ${displayColor}18, transparent 70%)`,
                        }}
                      />
                      <span
                        className="absolute left-1/2 -translate-x-1/2 rounded-full"
                        style={{
                          top: '18%',
                          height: '64%',
                          width: '2px',
                          backgroundColor: displayColor,
                          boxShadow: `0 0 12px ${displayColor}33`,
                        }}
                      />
                      <span
                        className="absolute top-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          left: '18%',
                          width: '64%',
                          height: '2px',
                          backgroundColor: displayColor,
                          boxShadow: `0 0 12px ${displayColor}33`,
                        }}
                      />
                      <span
                        className="absolute h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: displayColor,
                          boxShadow: `0 0 10px ${displayColor}55`,
                        }}
                      />
                    </>
                  )}
                  {showPanels && (
                    <span
                      className="absolute -top-6 rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: `${displayColor}12`,
                        color: displayColor,
                        border: `1px solid ${displayColor}33`,
                      }}
                    >
                      {marker.label}
                    </span>
                  )}
                </button>
                {showPanels && (
                  <div
                    className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded px-2 py-[2px] text-[10px] font-medium"
                    style={{
                      backgroundColor: 'rgba(15,23,42,0.92)',
                      border: `1px solid ${displayColor}33`,
                      color: '#F8FAFC',
                    }}
                  >
                    X {coordX.toFixed(1)} • Y {coordY.toFixed(1)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Full-length guide lines for the ACTIVE marker to aid mobile placement */}
          {(() => {
            const active = markers.find((m) => m.state === 'active');
            if (!active) return null;
            const left = toPixels(active.x, 'x');
            const top = toPixels(active.y, 'y');
            const guideColor = 'rgba(16, 185, 129, 0.8)'; // emerald-500 with opacity
            const guideSoft = 'rgba(16, 185, 129, 0.25)';
            return (
              <div className="pointer-events-none absolute inset-0 z-20">
                {/* Vertical guide (soft glow) */}
                <div
                  className="absolute"
                  style={{ left: left - 1, top: 0, width: 2, height: '100%', backgroundColor: guideSoft }}
                />
                {/* Vertical guide (crisp line) */}
                <div
                  className="absolute"
                  style={{ left, top: 0, width: 1, height: '100%', backgroundColor: guideColor }}
                />
                {/* Horizontal guide (soft glow) */}
                <div
                  className="absolute"
                  style={{ left: 0, top: top - 1, width: '100%', height: 2, backgroundColor: guideSoft }}
                />
                {/* Horizontal guide (crisp line) */}
                <div
                  className="absolute"
                  style={{ left: 0, top, width: '100%', height: 1, backgroundColor: guideColor }}
                />
                {/* Subtle target ring at intersection */}
                <div
                  className="absolute rounded-full border"
                  style={{
                    left: left - 12,
                    top: top - 12,
                    width: 24,
                    height: 24,
                    borderColor: guideColor,
                    boxShadow: `0 0 0 3px ${guideSoft}`,
                  }}
                />
              </div>
            );
          })()}

          {/* Magnifier lens centered on active marker when zoom > 1 */}
          {(() => {
            if (!imageLoaded || !imageUrl || zoomLevel <= 1) return null;
            const active = markers.find((m) => m.state === 'active');
            if (!active) return null;
            const left = toPixels(active.x, 'x');
            const top = toPixels(active.y, 'y');
            const lensSize = Math.min(180, Math.max(120, containerWidth * 0.22));
            const bgWidth = containerWidth * zoomLevel;
            const bgHeight = containerWidth * TARGET_RATIO * zoomLevel;
            const bgPosX = lensSize / 2 - left * zoomLevel;
            const bgPosY = lensSize / 2 - top * zoomLevel;
            return (
              <div
                className="pointer-events-none absolute z-30 rounded-full overflow-hidden"
                style={{
                  left: left - lensSize / 2,
                  top: top - lensSize / 2,
                  width: lensSize,
                  height: lensSize,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.35)'
                }}
              >
                <div
                  style={{
                    width: lensSize,
                    height: lensSize,
                    backgroundImage: `url(${imageUrl})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${bgWidth}px ${bgHeight}px`,
                    backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                    border: '2px solid rgba(255,255,255,0.9)'
                  }}
                />
              </div>
            );
          })()}

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
