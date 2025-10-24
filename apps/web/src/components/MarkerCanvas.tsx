'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text } from 'react-konva';

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

interface MarkerCanvasProps {
  imageUrl: string;
  tickets: Ticket[];
  markersPerTicket?: number;
  onMarkersChange: (markers: Marker[]) => void;
}

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

export default function MarkerCanvas({
  imageUrl,
  tickets,
  markersPerTicket = 3,
  onMarkersChange,
}: MarkerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState({ width: 0, height: 0 });

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
    setMarkers(initialMarkers);
    onMarkersChange(initialMarkers);
  }, [buildMarkersFromTickets, onMarkersChange]);

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.min(width * 0.75, 600); // 4:3 aspect ratio, max 600px height
        setStageSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load image and capture natural dimensions
  useEffect(() => {
    if (!imageUrl) {
      setImageElement(null);
      setImageLoaded(false);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setNaturalImageSize({ width: img.width, height: img.height });
      setImageElement(img);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageElement(null);
      setImageLoaded(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // Fit image within stage boundaries whenever stage or image changes
  useEffect(() => {
    if (!naturalImageSize.width || !naturalImageSize.height) {
      return;
    }

    const aspectRatio = naturalImageSize.width / naturalImageSize.height;
    let width = stageSize.width;
    let height = stageSize.height;

    if (aspectRatio > width / height) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }

    setImageSize({ width, height });
  }, [naturalImageSize, stageSize]);

  const handleMarkerDragMove = (markerId: string, e: any) => {
    const activeMarker = markers.find((marker) => marker.id === markerId);
    if (!activeMarker || activeMarker.locked) {
      return;
    }

    const position = e.target.position();

    // Clamp position within image bounds
    const clampedX = Math.max(0, Math.min(position.x, imageSize.width));
    const clampedY = Math.max(0, Math.min(position.y, imageSize.height));

    e.target.position({ x: clampedX, y: clampedY });

    // Normalize coordinates to 0-1 range
    const normalizedX = clampedX / imageSize.width;
    const normalizedY = clampedY / imageSize.height;

    const updatedMarkers = markers.map((marker) =>
      marker.id === markerId
        ? { ...marker, x: normalizedX, y: normalizedY }
        : marker
    );

    setMarkers(updatedMarkers);
    onMarkersChange(updatedMarkers);
  };

  const handleMarkerDragEnd = (markerId: string, e: any) => {
    const activeMarker = markers.find((marker) => marker.id === markerId);
    if (!activeMarker || activeMarker.locked) {
      return;
    }

    // Ensure final position is clamped
    const position = e.target.position();
    const clampedX = Math.max(0, Math.min(position.x, imageSize.width));
    const clampedY = Math.max(0, Math.min(position.y, imageSize.height));
    
    e.target.position({ x: clampedX, y: clampedY });
  };

  // Convert normalized coordinates to canvas coordinates for rendering
  const getCanvasPosition = (normalizedX: number, normalizedY: number) => ({
    x: normalizedX * imageSize.width,
    y: normalizedY * imageSize.height,
  });

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {/* Competition Image */}
            {imageElement && (
              <KonvaImage image={imageElement} width={imageSize.width} height={imageSize.height} />
            )}

            {/* Markers */}
            {imageLoaded && markers.map((marker) => {
              const pos = getCanvasPosition(marker.x, marker.y);
              return (
                <Fragment key={marker.id}>
                  {/* Marker Circle */}
                  <Circle
                    x={pos.x}
                    y={pos.y}
                    radius={12}
                    fill={marker.color}
                    stroke="#ffffff"
                    strokeWidth={3}
                    draggable={!marker.locked}
                    opacity={marker.locked ? 0.65 : 1}
                    onDragMove={(e) => handleMarkerDragMove(marker.id, e)}
                    onDragEnd={(e) => handleMarkerDragEnd(marker.id, e)}
                    shadowColor="black"
                    shadowBlur={10}
                    shadowOpacity={0.3}
                    shadowOffsetX={2}
                    shadowOffsetY={2}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = marker.locked ? 'not-allowed' : 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'default';
                    }}
                  />
                  {/* Marker Label */}
                  <Text
                    x={pos.x}
                    y={pos.y}
                    text={marker.label}
                    fontSize={10}
                    fontStyle="bold"
                    fill={marker.locked ? '#E2E8F0' : '#ffffff'}
                    align="center"
                    verticalAlign="middle"
                    offsetX={12}
                    offsetY={5}
                    listening={false}
                  />
                </Fragment>
              );
            })}
          </Layer>
        </Stage>
        {allTicketsLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-white text-sm font-semibold text-center px-4">
            All assigned tickets have been submitted. Marker positions are read-only.
          </div>
        )}
      </div>

      {/* Marker Legend */}
      <div className="bg-white p-4 rounded-lg border">
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

      {/* Marker Data Export (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 mb-2">
            Debug: View Normalized Coordinates
          </summary>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(
              markers.map((m) => ({
                id: m.id,
                ticket: m.ticketId,
                locked: m.locked,
                x: m.x.toFixed(4),
                y: m.y.toFixed(4),
              })),
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
