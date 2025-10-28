import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  MockCompetition,
  closeCompetition,
  calculateTicketsSold,
  createCompetition,
  getCompetitionById,
  getCompetitionsWithStats,
  setCompetitionFinalResult,
  findCompetitionById,
  getParticipantsByCompetition,
  saveCompetitionResult,
  getCompetitionResult,
  MockCompetitionWinner,
  MockCompetitionResult,
  findParticipantById,
  getCheckoutSummary,
  getCheckoutSummariesByCompetition,
} from '../data/mockDb';

const router: Router = Router();

/**
 * @route   GET /api/v1/admin/participants
 * @desc    Get all participants across all competitions
 * @access  Protected (Admin only)
 */
router.get(
  '/participants',
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      // Get all competitions
      const competitions = getCompetitionsWithStats();

      // Aggregate only participants that completed checkout (have a summary)
      const allParticipants = competitions.flatMap((comp) =>
        getParticipantsByCompetition(comp.id)
          .map((participant) => {
            const summary = getCheckoutSummary(comp.id, participant.id);
            if (!summary) {
              return null;
            }

            const resolvedId = summary.userId ?? participant.id;
            return {
              id: resolvedId,
              participantId: summary.participant?.id ?? participant.id,
              competitionId: summary.competition?.id ?? comp.id,
              name: summary.participant?.name ?? participant.name,
              phone: summary.participant?.phone ?? participant.phone,
              email: summary.participant?.email ?? summary.contactEmail ?? participant.email ?? null,
              createdAt: summary.checkoutTime,
              assignedTickets: summary.participant?.ticketsPurchased ?? participant.tickets.length,
              ticketsPurchased: summary.participant?.ticketsPurchased ?? participant.tickets.length,
              isLoggedIn: false, // Mock: assume offline
              lastLoginAt: summary.checkoutTime,
              lastLogoutAt: null,
              accessCode: resolvedId.slice(-4).toUpperCase(),
              currentPhase: null, // Mock phase
            };
          })
          .filter((participant): participant is NonNullable<typeof participant> => Boolean(participant))
      );

      // Deduplicate participants by their resolved user id, keeping the latest details
      const participantsById = new Map<string, (typeof allParticipants)[number]>();

      allParticipants.forEach((record) => {
        const existing = participantsById.get(record.id);
        if (!existing) {
          participantsById.set(record.id, record);
          return;
        }

        const existingTime = Date.parse(existing.createdAt ?? "");
        const recordTime = Date.parse(record.createdAt ?? "");
        const useRecord = Number.isFinite(recordTime) && (!Number.isFinite(existingTime) || recordTime >= existingTime);
        const latest = useRecord ? record : existing;
        const fallback = useRecord ? existing : record;

        participantsById.set(record.id, {
          ...fallback,
          ...latest,
          createdAt: Number.isFinite(existingTime) && Number.isFinite(recordTime)
            ? (existingTime <= recordTime ? existing.createdAt : record.createdAt)
            : (existing.createdAt ?? record.createdAt),
          lastLoginAt: latest.lastLoginAt ?? fallback.lastLoginAt ?? null,
          lastLogoutAt: latest.lastLogoutAt ?? fallback.lastLogoutAt ?? null,
          assignedTickets: latest.assignedTickets,
          ticketsPurchased: latest.ticketsPurchased,
          email: latest.email ?? fallback.email ?? null,
        });
      });

      const dedupedParticipants = Array.from(participantsById.values()).sort((a, b) => {
        const timeA = Date.parse(a.createdAt ?? "");
        const timeB = Date.parse(b.createdAt ?? "");
        if (!Number.isFinite(timeA) && !Number.isFinite(timeB)) {
          return a.name.localeCompare(b.name);
        }
        if (!Number.isFinite(timeA)) {
          return 1;
        }
        if (!Number.isFinite(timeB)) {
          return -1;
        }
        return timeA - timeB;
      });

      res.status(200).json({
        status: 'success',
        data: dedupedParticipants,
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch participants',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/competitions
 * @desc    List competitions with stats
 * @access  Protected (Admin only)
 */
router.get(
  '/competitions',
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const competitions = getCompetitionsWithStats();

      res.status(200).json({
        status: 'success',
        data: {
          competitions,
        },
      });
    } catch (error) {
      console.error('Error fetching competitions:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch competitions',
      });
    }
  }
);

/**
 * @route   POST /api/v1/admin/competitions
 * @desc    Create a new competition
 * @access  Protected (Admin only)
 */
router.post(
  '/competitions',
  authenticateToken,
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('maxEntries').isInt({ min: 1 }).withMessage('maxEntries must be at least 1'),
    body('invitePassword').notEmpty().withMessage('Invite password is required'),
    body('imageUrl').isURL().withMessage('Valid image URL is required'),
    body('pricePerTicket')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('pricePerTicket must be a positive number'),
    body('markersPerTicket')
      .optional()
      .isInt({ min: 1 })
      .withMessage('markersPerTicket must be at least 1'),
    body('endsAt')
      .optional()
      .isISO8601()
      .withMessage('endsAt must be a valid ISO date string'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'fail',
        errors: errors.array(),
      });
      return;
    }

    try {
      const { title, maxEntries, invitePassword, imageUrl, pricePerTicket, markersPerTicket, endsAt } =
        req.body as {
          title: string;
          maxEntries: number;
          invitePassword: string;
          imageUrl: string;
          pricePerTicket?: number;
          markersPerTicket?: number;
          endsAt?: string;
        };

      const competition = await createCompetition({
        title,
        maxEntries,
        invitePassword,
        imageUrl,
        pricePerTicket,
        markersPerTicket,
        endsAt,
      });

      res.status(201).json({
        status: 'success',
        data: {
          competition,
        },
      });
    } catch (error) {
      console.error('Error creating competition:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create competition',
      });
    }
  }
);

/**
 * @route   PATCH /api/v1/admin/competitions/:id/close
 * @desc    Close a competition
 * @access  Protected (Admin only)
 */
router.patch(
  '/competitions/:id/close',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const competition = getCompetitionById(id);

      if (competition.status === 'CLOSED') {
        res.status(409).json({
          status: 'fail',
          message: 'Competition already closed',
        });
        return;
      }

      const updated: MockCompetition | null = closeCompetition(id);
      if (!updated) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to close competition',
        });
        return;
      }

      const ticketsSold = calculateTicketsSold(id);

      res.status(200).json({
        status: 'success',
        data: {
          competition: {
            ...updated,
            ticketsSold,
            remainingSlots: Math.max(0, updated.maxEntries - ticketsSold),
          },
        },
      });
    } catch (error) {
      console.error('Error closing competition:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to close competition',
      });
    }
  }
);

/**
 * @route   PATCH /api/v1/admin/competitions/:id/final-result
 * @desc    Store final judged coordinates
 * @access  Protected (Admin only)
 */
router.patch(
  '/competitions/:id/final-result',
  authenticateToken,
  requireAdmin,
  [
    body('finalJudgeX')
      .exists()
      .withMessage('finalJudgeX is required')
      .isFloat({ min: 0, max: 1 })
      .withMessage('finalJudgeX must be between 0 and 1'),
    body('finalJudgeY')
      .exists()
      .withMessage('finalJudgeY is required')
      .isFloat({ min: 0, max: 1 })
      .withMessage('finalJudgeY must be between 0 and 1'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'fail',
        errors: errors.array(),
      });
      return;
    }

    try {
      const { id } = req.params;
      const { finalJudgeX, finalJudgeY } = req.body as {
        finalJudgeX: number | string;
        finalJudgeY: number | string;
      };

      const finalJudgeXValue = Number(finalJudgeX);
      const finalJudgeYValue = Number(finalJudgeY);

      const updatedCompetition = setCompetitionFinalResult(
        id,
        finalJudgeXValue,
        finalJudgeYValue
      );

      if (!updatedCompetition) {
        res.status(404).json({
          status: 'fail',
          message: 'Competition not found',
        });
        return;
      }

      const ticketsSold = calculateTicketsSold(id);

      res.status(200).json({
        status: 'success',
        data: {
          competition: {
            ...updatedCompetition,
            ticketsSold,
            remainingSlots: Math.max(0, updatedCompetition.maxEntries - ticketsSold),
          },
        },
      });
    } catch (error) {
      console.error('Error saving final result:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to save final result',
      });
    }
  }
);

/**
 * @route   POST /api/v1/admin/competitions/:id/judges
 * @desc    Submit judge coordinates
 * @access  Protected (Admin only)
 */
router.post(
  '/competitions/:id/judges',
  authenticateToken,
  requireAdmin,
  [
    body('judgeMarks').isArray().withMessage('Judge marks must be an array'),
    body('judgeMarks.*.judgeName').notEmpty().withMessage('Judge name is required'),
    body('judgeMarks.*.x').isFloat().withMessage('X coordinate must be a number'),
    body('judgeMarks.*.y').isFloat().withMessage('Y coordinate must be a number'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'fail',
        errors: errors.array(),
      });
      return;
    }

    try {
      const { id } = req.params;
      const { judgeMarks } = req.body;

      // TODO: Save judge marks and compute winners
      console.log('Submitting judge marks for competition:', id, judgeMarks);
      
      res.status(200).json({
        status: 'success',
        data: {
          message: 'Judge marks submitted successfully',
          winnersComputed: true,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit judge marks',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/competitions/:id/results
 * @desc    Get competition results
 * @access  Protected (Admin only)
 */
router.get(
  '/competitions/:id/results',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const competition = findCompetitionById(id);
      if (!competition) {
        res.status(404).json({
          status: 'fail',
          message: 'Competition not found',
        });
        return;
      }

      const result = getCompetitionResult(id);
      console.log(`[GET-RESULTS] Fetching result for competition ID: "${id}"`);
      console.log(`[GET-RESULTS] Retrieved result for competition ${id}:`, result);

      const responsePayload = {
        competition: {
          id: competition.id,
          title: competition.title,
          status: competition.status,
          finalJudgeX: typeof competition.finalJudgeX === 'number' ? competition.finalJudgeX : null,
          finalJudgeY: typeof competition.finalJudgeY === 'number' ? competition.finalJudgeY : null,
          markersPerTicket: competition.markersPerTicket,
          ticketsSold: calculateTicketsSold(competition.id),
          maxEntries: competition.maxEntries,
        },
        result: result
          ? {
              competitionId: result.competitionId,
              finalJudgeX: result.finalJudgeX,
              finalJudgeY: result.finalJudgeY,
              computedAt: result.computedAt.toISOString(),
            }
          : null,
        winners: result
          ? result.winners.map((winner) => ({
              ticketId: winner.ticketId,
              ticketNumber: winner.ticketNumber,
              participantId: winner.participantId,
              userId: winner.userId ?? null,
              participantName: winner.participantName,
              participantPhone: winner.participantPhone,
              distance: Number.isFinite(winner.distance)
                ? Number(winner.distance.toFixed(6))
                : null,
              marker: winner.marker
                ? {
                    id: winner.marker.id,
                    x: winner.marker.x,
                    y: winner.marker.y,
                  }
                : null,
            }))
          : [],
      };

      res.status(200).json({
        status: 'success',
        data: responsePayload,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch results',
      });
    }
  }
);

/**
 * @route   POST /api/v1/admin/competitions/:id/compute-winner
 * @desc    Compute winners based on final judge coordinates
 * @access  Protected (Admin only)
 */
router.post(
  '/competitions/:id/compute-winner',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log(`[COMPUTE-WINNER] Starting compute for competition ID: "${id}"`);

      const competition = findCompetitionById(id);
      if (!competition) {
        res.status(404).json({
          status: 'fail',
          message: 'Competition not found',
        });
        return;
      }

      if (typeof competition.finalJudgeX !== 'number' || typeof competition.finalJudgeY !== 'number') {
        res.status(409).json({
          status: 'fail',
          message: 'Final judge coordinates are not set for this competition',
        });
        return;
      }

      const finalJudgeX = competition.finalJudgeX as number;
      const finalJudgeY = competition.finalJudgeY as number;

      // Get all checkout summaries for this competition instead of mock participants
      const checkoutSummaries = getCheckoutSummariesByCompetition(id);
      console.log(`[COMPUTE-WINNER] Found ${checkoutSummaries.length} checkout summaries for competition ${id}`);

      const ticketScores: MockCompetitionWinner[] = [];

      checkoutSummaries.forEach((summary) => {
        console.log(`[COMPUTE-WINNER]   Processing checkout summary: ${summary.userId || summary.participant?.id} with ${Array.isArray(summary.tickets) ? summary.tickets.length : 0} tickets`);
        const userId = summary.userId ?? summary.participant?.id ?? '';
        const participantName = summary.participant?.name ?? '';
        const participantPhone = summary.participant?.phone ?? '';
        const participantId = summary.participant?.id ?? userId;

        const summaryTickets = Array.isArray(summary.tickets) ? summary.tickets : [];
        summaryTickets.forEach((ticketSummary, index) => {
          const markerList = Array.isArray(ticketSummary?.markers)
            ? ticketSummary.markers
            : [];

          const summaryTicketNumber =
            typeof ticketSummary.ticketNumber === 'number'
              ? ticketSummary.ticketNumber
              : Number.parseInt(String(ticketSummary.ticketNumber ?? ''), 10);

          const normalizedMarkers = markerList
            .map((rawMarker, markerIndex) => {
              if (!rawMarker || typeof rawMarker !== 'object') {
                return null;
              }

              const x = Number((rawMarker as any).x);
              const y = Number((rawMarker as any).y);

              if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return null;
              }

              const id =
                typeof (rawMarker as any).id === 'string'
                  ? (rawMarker as any).id
                  : `${participantId}:${Number.isFinite(summaryTicketNumber) ? summaryTicketNumber : index}-marker-${markerIndex + 1}`;

              return { id, x, y };
            })
            .filter((marker): marker is { id: string; x: number; y: number } => marker !== null);

          if (!normalizedMarkers.length) {
            return;
          }

          // Use ticket info from summary directly since we don't have participant.tickets
          const fallbackTicketId = `${participantId}:${Number.isFinite(summaryTicketNumber) ? summaryTicketNumber : index}`;
          const fallbackTicketNumber = Number.isFinite(summaryTicketNumber) ? summaryTicketNumber : index + 1;

          const closest = normalizedMarkers.reduce(
            (acc, marker) => {
              const distance = Math.hypot(marker.x - finalJudgeX, marker.y - finalJudgeY);

              if (distance < acc.distance) {
                return {
                  marker,
                  distance,
                };
              }

              return acc;
            },
            {
              marker: normalizedMarkers[0],
              distance: Math.hypot(
                normalizedMarkers[0].x - finalJudgeX,
                normalizedMarkers[0].y - finalJudgeY
              ),
            }
          );

          ticketScores.push({
            ticketId: fallbackTicketId,
            ticketNumber: fallbackTicketNumber,
            participantId,
            userId,
            participantName,
            participantPhone,
            distance: closest.distance,
            marker: closest.marker,
          });
        });
      });

      if (!ticketScores.length) {
        const emptyResult: MockCompetitionResult = {
          competitionId: id,
          finalJudgeX,
          finalJudgeY,
          winners: [],
          computedAt: new Date(),
        };
        saveCompetitionResult(emptyResult);

        res.status(200).json({
          status: 'success',
          data: {
            result: {
              competitionId: emptyResult.competitionId,
              finalJudgeX: emptyResult.finalJudgeX,
              finalJudgeY: emptyResult.finalJudgeY,
              computedAt: emptyResult.computedAt.toISOString(),
            },
            winners: [],
          },
        });
        return;
      }

      const sortedWinners = ticketScores
        .slice()
        .sort((a, b) => a.distance - b.distance)
        .reduce((uniqueWinners: MockCompetitionWinner[], current) => {
          // Check if this ticket ID has already been selected as a winner
          const isDuplicate = uniqueWinners.some((winner) => winner.ticketId === current.ticketId);
          if (!isDuplicate) {
            uniqueWinners.push(current);
          }
          return uniqueWinners;
        }, [])
        .slice(0, 3);

      console.log(`[COMPUTE-WINNER] Total ticket scores: ${ticketScores.length}, unique winners: ${sortedWinners.length}`);

      const result: MockCompetitionResult = {
        competitionId: id,
  finalJudgeX,
  finalJudgeY,
        winners: sortedWinners,
        computedAt: new Date(),
      };

      console.log(`[COMPUTE-WINNER] Saving ${sortedWinners.length} winners for competition ${id}:`, sortedWinners);
      saveCompetitionResult(result);
      console.log(`[COMPUTE-WINNER] Result saved for competition ${id}`);

      res.status(200).json({
        status: 'success',
        data: {
          result: {
            competitionId: result.competitionId,
            finalJudgeX: result.finalJudgeX,
            finalJudgeY: result.finalJudgeY,
            computedAt: result.computedAt.toISOString(),
          },
          winners: result.winners.map((winner) => ({
            ...winner,
            userId: winner.userId ?? null,
            distance: Number(winner.distance.toFixed(6)),
          })),
        },
      });
    } catch (error) {
      console.error('Error computing winners:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to compute winners',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/competitions/:id/participants/:participantId/submissions
 * @desc    Get participant submissions for admin view
 * @access  Protected (Admin only)
 */
router.get(
  '/competitions/:id/participants/:participantId/submissions',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id, participantId } = req.params;

      const participant = findParticipantById(id, participantId);
      if (!participant) {
        res.status(404).json({
          status: 'fail',
          message: 'Participant not found',
        });
        return;
      }

      const competition = findCompetitionById(id);
      if (!competition) {
        res.status(404).json({
          status: 'fail',
          message: 'Competition not found',
        });
        return;
      }

      const submittedTickets = participant.tickets
        .filter((ticket) => ticket.status === 'USED')
        .map((ticket) => ({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          markersAllowed: ticket.markersAllowed,
          markersUsed: ticket.markersUsed,
          markers: ticket.markers,
          submittedAt: ticket.submittedAt?.toISOString(),
        }));

      res.status(200).json({
        status: 'success',
        data: {
          participant: {
            id: participant.id,
            name: participant.name,
            phone: participant.phone,
            ticketsPurchased: participant.tickets.length,
          },
          competition: {
            id: competition.id,
            title: competition.title,
            imageUrl: competition.imageUrl,
            markersPerTicket: competition.markersPerTicket,
            finalJudgeX: competition.finalJudgeX,
            finalJudgeY: competition.finalJudgeY,
          },
          submissions: submittedTickets,
          submissionCount: submittedTickets.length,
          totalMarkersSubmitted: submittedTickets.reduce((sum, t) => sum + t.markersUsed, 0),
        },
      });
    } catch (error) {
      console.error('Error retrieving participant submissions:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve submissions',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Protected (Admin only)
 */
router.get(
  '/dashboard/stats',
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      // TODO: Fetch stats from database
      
      res.status(200).json({
        status: 'success',
        data: {
          totalCompetitions: 0,
          activeCompetitions: 0,
          totalParticipants: 0,
          totalRevenue: 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch dashboard stats',
      });
    }
  }
);

/**
 * @route   POST /api/v1/admin/competitions/:id/assign-tickets
 * @desc    Assign tickets to a participant
 * @access  Protected (Admin only)
 */
router.post(
  '/competitions/:id/assign-tickets',
  authenticateToken,
  requireAdmin,
  [
    body('participantId').notEmpty().withMessage('Participant ID is required'),
    body('ticketCount').isInt({ min: 1, max: 100 }).withMessage('Ticket count must be between 1 and 100'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'fail',
        errors: errors.array(),
      });
      return;
    }

    try {
      const { id: competitionId } = req.params;
      const { participantId, ticketCount } = req.body;

      // TODO: Fetch competition from database
      // const competition = await prisma.competition.findUnique({
      //   where: { id: competitionId },
      //   include: { _count: { select: { Ticket: true } } }
      // });

      // Mock competition data
      const mockCompetition = {
        id: competitionId,
        maxEntries: 100,
        ticketsSold: 45,
        status: 'ACTIVE',
        pricePerTicket: 500,
      };

      if (!mockCompetition) {
        res.status(404).json({
          status: 'fail',
          message: 'Competition not found',
        });
        return;
      }

      if (mockCompetition.status !== 'ACTIVE') {
        res.status(403).json({
          status: 'fail',
          message: 'Cannot assign tickets to inactive competition',
        });
        return;
      }

      // Check if enough slots available
      const remainingSlots = mockCompetition.maxEntries - mockCompetition.ticketsSold;
      if (ticketCount > remainingSlots) {
        res.status(400).json({
          status: 'fail',
          message: `Only ${remainingSlots} slots remaining. Cannot assign ${ticketCount} tickets.`,
        });
        return;
      }

      // TODO: Check if participant exists
      // const participant = await prisma.participant.findUnique({
      //   where: { id: participantId }
      // });

      const mockParticipant = {
        id: participantId,
        name: 'John Doe',
        email: 'john@example.com',
      };

      if (!mockParticipant) {
        res.status(404).json({
          status: 'fail',
          message: 'Participant not found',
        });
        return;
      }

      // TODO: Create tickets in database
      // const tickets = await Promise.all(
      //   Array.from({ length: ticketCount }, async (_, index) => {
      //     return await prisma.ticket.create({
      //       data: {
      //         competitionId,
      //         participantId,
      //         status: 'RESERVED',
      //         purchaseDate: new Date(),
      //         amount: mockCompetition.pricePerTicket,
      //       }
      //     });
      //   })
      // );

      // TODO: Update competition ticketsSold count
      // await prisma.competition.update({
      //   where: { id: competitionId },
      //   data: { ticketsSold: { increment: ticketCount } }
      // });

      // Mock response
      const mockTickets = Array.from({ length: ticketCount }, (_, index) => ({
        id: `ticket-${Date.now()}-${index}`,
        competitionId,
        participantId,
        status: 'RESERVED',
        purchaseDate: new Date().toISOString(),
        amount: mockCompetition.pricePerTicket,
      }));

      console.log(`Assigned ${ticketCount} tickets to participant ${participantId} for competition ${competitionId}`);

      res.status(201).json({
        status: 'success',
        data: {
          message: `Successfully assigned ${ticketCount} ticket(s) to ${mockParticipant.name}`,
          tickets: mockTickets,
          newTicketsSold: mockCompetition.ticketsSold + ticketCount,
          remainingSlots: remainingSlots - ticketCount,
        },
      });
    } catch (error) {
      console.error('Error assigning tickets:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign tickets',
      });
    }
  }
);

/**
 * @route   GET /api/v1/admin/competitions/:id/export
 * @desc    Export competition results as CSV
 * @access  Protected (Admin only)
 */
router.get(
  '/competitions/:id/export',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const competition = findCompetitionById(id);
      if (!competition) {
        res.status(404).json({
          status: 'fail',
          message: 'Competition not found',
        });
        return;
      }

      const participants = getParticipantsByCompetition(id);
      const result = getCompetitionResult(id);

      const finalJudgeX =
        typeof competition.finalJudgeX === 'number' ? competition.finalJudgeX : null;
      const finalJudgeY =
        typeof competition.finalJudgeY === 'number' ? competition.finalJudgeY : null;
      const computedAt = result?.computedAt ?? null;

      const winnerRankByTicketId = new Map<string, number>();
      result?.winners.forEach((winner, index) => {
        winnerRankByTicketId.set(winner.ticketId, index + 1);
      });

      const headers = [
        'competitionId',
        'competitionTitle',
        'participantId',
        'participantName',
        'participantPhone',
        'ticketId',
        'ticketNumber',
        'ticketStatus',
        'markerId',
        'markerX',
        'markerY',
        'distanceToFinal',
        'winnerRank',
        'finalJudgeX',
        'finalJudgeY',
        'computedAt',
      ];

      const rows: string[][] = [headers];

      const formatNumber = (value: number | null, fractionDigits = 6) => {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return '';
        }
        return value.toFixed(fractionDigits);
      };

      const escapeCsvValue = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = typeof value === 'number' ? value.toString() : String(value);
        if (/[",\n]/.test(stringValue)) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const appendRow = (row: Array<string | number | null | undefined>) => {
        rows.push(row.map((value) => escapeCsvValue(value)));
      };

      if (participants.length === 0) {
        appendRow([
          competition.id,
          competition.title,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          formatNumber(finalJudgeX, 6),
          formatNumber(finalJudgeY, 6),
          computedAt ? computedAt.toISOString() : '',
        ]);
      } else {
        participants.forEach((participant) => {
          if (participant.tickets.length === 0) {
            appendRow([
              competition.id,
              competition.title,
              participant.id,
              participant.name,
              participant.phone,
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              formatNumber(finalJudgeX, 6),
              formatNumber(finalJudgeY, 6),
              computedAt ? computedAt.toISOString() : '',
            ]);
            return;
          }

          participant.tickets.forEach((ticket) => {
            const winnerRank = winnerRankByTicketId.get(ticket.id) ?? '';

            if (ticket.markers.length === 0) {
              appendRow([
                competition.id,
                competition.title,
                participant.id,
                participant.name,
                participant.phone,
                ticket.id,
                ticket.ticketNumber,
                ticket.status,
                '',
                '',
                '',
                '',
                winnerRank,
                formatNumber(finalJudgeX, 6),
                formatNumber(finalJudgeY, 6),
                computedAt ? computedAt.toISOString() : '',
              ]);
              return;
            }

            ticket.markers.forEach((marker) => {
              const distance =
                finalJudgeX !== null && finalJudgeY !== null
                  ? Math.hypot(marker.x - finalJudgeX, marker.y - finalJudgeY)
                  : null;

              appendRow([
                competition.id,
                competition.title,
                participant.id,
                participant.name,
                participant.phone,
                ticket.id,
                ticket.ticketNumber,
                ticket.status,
                marker.id,
                formatNumber(marker.x, 6),
                formatNumber(marker.y, 6),
                formatNumber(distance, 6),
                winnerRank,
                formatNumber(finalJudgeX, 6),
                formatNumber(finalJudgeY, 6),
                computedAt ? computedAt.toISOString() : '',
              ]);
            });
          });
        });
      }

      const csvContent = rows.map((row) => row.join(',')).join('\r\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="competition-${id}-results.csv"`
      );

      res.status(200).send(csvContent);
    } catch (error) {
      console.error('Error exporting competition results:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to export competition results',
      });
    }
  }
);

export default router;
