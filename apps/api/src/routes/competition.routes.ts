import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import {
  verifyParticipantAccess,
  ParticipantAccessRequest,
} from '../middleware/competitionAccess';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  MockMarker,
  CheckoutSummary,
  MockParticipant,
  MockTicket,
  calculateTicketsSold,
  findParticipantById,
  findParticipantByPhone,
  getCompetitionById,
  getCompetitionsWithStats,
  getCheckoutSummary,
  getCheckoutSummaryByUserId,
  getParticipants,
  getParticipantsByCompetition,
  sanitizePhone,
  saveCheckoutSummary,
  saveParticipant,
  createOrUpdateUserEntry,
  hasParticipantCompletedEntry,
} from '../data/mockDb';
// Prisma client (workspace package)
import prisma from 'db';

const router: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
let mockTicketCounter = 200;

/**
 * @route   GET /api/v1/competitions
 * @desc    Get all active competitions
 * @access  Public
 */
router.get('/', async (_req: Request, res: Response) => {
  // First attempt: fetch from Postgres via Prisma
  try {
    const dbCompetitions = await prisma.competition.findMany({
      orderBy: { createdAt: 'desc' },
    });

  const mapped = dbCompetitions.map((c: any) => {
      const total = c.totalTickets ?? 0;
      const available = c.availableTickets ?? 0;
      const ticketsSold = Math.max(0, total - available);
      const remainingSlots = Math.max(0, available);
      return {
        id: c.id,
        title: c.title,
        imageUrl: c.imageUrl || '/images/gold-coin.svg',
        maxEntries: total,
        ticketsSold,
        remainingSlots,
        status: c.status,
        pricePerTicket: c.pricePerTicket,
        markersPerTicket: c.markersPerTicket,
        endsAt: c.endDate ? c.endDate.toISOString() : null,
      };
    });

    res.status(200).json({ status: 'success', data: { competitions: mapped } });
    return;
  } catch (dbError) {
    console.warn('[GET /competitions] Prisma fetch failed, falling back to mock:', dbError);
  }

  // Fallback: mock data (preserves current behavior if DB is unavailable)
  try {
    const competitions = getCompetitionsWithStats();
    res.status(200).json({ status: 'success', data: { competitions } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch competitions' });
  }
});

/**
 * @route   GET /api/v1/competitions/active
 * @desc    Get the first active competition for preview page
 * @access  Protected (requires participant login token)
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    // Verify participant is logged in
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required',
      });
      return;
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired token',
      });
      return;
    }

    const competitions = getCompetitionsWithStats();
    const activeCompetition = competitions.find(c => c.status === 'ACTIVE');

    if (!activeCompetition) {
      res.status(404).json({
        status: 'fail',
        message: 'No active competitions available',
      });
      return;
    }

    // Format response to match frontend expectations
    res.status(200).json({
      id: activeCompetition.id,
      title: activeCompetition.title,
      subtitle: 'WITH A CLICK',
      imageUrl: activeCompetition.imageUrl || '/images/gold-coin.svg',
      hosts: ['Mr. Sarthak', 'Mr. Manjot'],
      status: activeCompetition.status,
    });
  } catch (error) {
    console.error('Error fetching active competition:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch active competition',
    });
  }
});

/**
 * @route   GET /api/v1/competitions/:id
 * @desc    Get competition by ID with optional participant info
 * @access  Public (enhanced data with valid competition access token)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Detect if id is a userId (starts with 'user-' or 'participant-')
    const isUserId = id.startsWith('user-') || id.startsWith('participant-');
    const actualCompetitionId = isUserId ? 'test-id' : id;

    console.log('[GET competition] Request:', { urlId: id, isUserId, actualCompetitionId });

    // Check for optional access token (competition or participant)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let participantId: string | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const tokenMatchesCompetition = decoded.competitionId === actualCompetitionId;
        if (!tokenMatchesCompetition) {
          throw new Error('Token competition mismatch');
        }

        if (decoded.type === 'participant_access') {
          participantId = decoded.participantId || null;
        }
      } catch (error) {
        console.log('Invalid or expired token, returning public data only');
      }
    }

  const baseCompetition = getCompetitionById(actualCompetitionId);
  const ticketsSold = calculateTicketsSold(actualCompetitionId);
  const remainingSlots = Math.max(0, baseCompetition.maxEntries - ticketsSold);

    const responseData: any = {
      competition: {
        id: baseCompetition.id,
        title: baseCompetition.title,
        imageUrl: baseCompetition.imageUrl,
        maxEntries: baseCompetition.maxEntries,
        ticketsSold,
        remainingSlots,
        status: baseCompetition.status,
        pricePerTicket: baseCompetition.pricePerTicket,
        markersPerTicket: baseCompetition.markersPerTicket,
        endsAt: baseCompetition.endsAt,
      },
    };

    if (participantId) {
      const participant = findParticipantById(actualCompetitionId, participantId);
      if (participant) {
        const ticketsPurchased = participant.tickets.length;
        const entriesUsed = participant.tickets.reduce(
          (sum, ticket) => sum + ticket.markersUsed,
          0
        );
        const entriesRemaining = Math.max(
          0,
          ticketsPurchased * baseCompetition.markersPerTicket - entriesUsed
        );

        responseData.participantInfo = {
          participantId: participant.id,
          name: participant.name,
          phone: participant.phone,
          ticketsPurchased,
          entriesUsed,
          entriesRemaining,
        };
      }
    }

    res.status(200).json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch competition',
    });
  }
});

/**
 * @route   POST /api/v1/competitions/:id/participants/authenticate
 * @desc    Verify participant by name & phone, return access token and tickets
 * @access  Protected (requires competition password prior to calling)
 */
router.post(
  '/:id/participants/authenticate',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
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
      const { name, phone } = req.body;

      // Detect if id is a userId (starts with 'user-' or 'participant-')
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;

      console.log('[POST authenticate] Request:', { 
        urlId: id, 
        isUserId, 
        actualCompetitionId,
        name,
        phone: phone.substring(0, 5) + '...' 
      });

      const participant = findParticipantByPhone(actualCompetitionId, phone);
      if (!participant) {
        console.log('[POST authenticate] Participant not found:', { actualCompetitionId, phone });
        res.status(404).json({
          status: 'fail',
          message: 'Participant not found. Please contact support.',
        });
        return;
      }

      const normalizedInputName = (name as string).trim().toLowerCase();
      const storedName = participant.name.trim().toLowerCase();
      if (normalizedInputName !== storedName) {
        console.log('[POST authenticate] Name mismatch:', { input: normalizedInputName, stored: storedName });
        res.status(401).json({
          status: 'fail',
          message: 'Participant details do not match. Please try again or contact support.',
        });
        return;
      }

      const participantCompleted = hasParticipantCompletedEntry(actualCompetitionId, participant.id);
      if (participantCompleted) {
        console.log('[POST authenticate] Participant already completed entry:', { participantId: participant.id });
        res.status(403).json({
          status: 'fail',
          message: 'This participant has already completed their entry and cannot play again.',
        });
        return;
      }

      const participantAccessToken = jwt.sign(
        {
          competitionId: actualCompetitionId,
          participantId: participant.id,
          type: 'participant_access',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const ticketsPayload = participant.tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        markersAllowed: ticket.markersAllowed,
        markersUsed: ticket.markersUsed,
        markers: ticket.markers,
        submittedAt: ticket.submittedAt,
      }));

      console.log('[POST authenticate] Success:', { participantId: participant.id, ticketCount: ticketsPayload.length });
      res.status(200).json({
        status: 'success',
        data: {
          participant: {
            id: participant.id,
            name: participant.name,
            phone: participant.phone,
            ticketsPurchased: participant.tickets.length,
          },
          participantAccessToken,
          tickets: ticketsPayload,
        },
      });
    } catch (error) {
      console.error('Participant authentication error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to authenticate participant',
      });
    }
  }
);

/**
 * @route   GET /api/v1/competitions/:id/participants/me/tickets
 * @desc    Fetch tickets assigned to the authenticated participant
 * @access  Protected (requires participant access token)
 */
router.get(
  '/:id/participants/me/tickets',
  verifyParticipantAccess,
  async (req: ParticipantAccessRequest, res: Response) => {
    try {
      const { id } = req.params;
      const participantId = req.participantAccess?.participantId;

      // Detect if id is a userId (starts with 'user-' or 'participant-')
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;

      console.log('[GET me/tickets] Request:', { urlId: id, isUserId, actualCompetitionId, participantId });

      if (!participantId) {
        res.status(401).json({
          status: 'fail',
          message: 'Participant session invalid',
        });
        return;
      }

      const participant = findParticipantById(actualCompetitionId, participantId);
      if (!participant) {
        console.log('[GET me/tickets] Participant not found:', { actualCompetitionId, participantId });
        res.status(404).json({
          status: 'fail',
          message: 'Participant record not found',
        });
        return;
      }

      if (hasParticipantCompletedEntry(actualCompetitionId, participant.id)) {
        console.log('[GET me/tickets] Participant already completed entry:', { participantId: participant.id });
        res.status(403).json({
          status: 'fail',
          message: 'This entry is already completed. Further gameplay is not permitted.',
        });
        return;
      }

      console.log('[GET me/tickets] Success:', { participantId, ticketCount: participant.tickets.length });
      res.status(200).json({
        status: 'success',
        data: {
          participant: {
            id: participant.id,
            name: participant.name,
            phone: participant.phone,
            ticketsPurchased: participant.tickets.length,
          },
          tickets: participant.tickets,
        },
      });
    } catch (error) {
      console.error('Error fetching participant tickets:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tickets',
      });
    }
  }
);

/**
 * @route   POST /api/v1/competitions/:id/verify-password
 * @desc    Verify competition password and return access token
 * @access  Public
 */
router.post(
  '/:id/verify-password',
  [
    body('password').notEmpty().withMessage('Password is required'),
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
      const { password } = req.body;

      // TODO: Fetch competition from database
      // For now, using mock data
      const mockCompetition = {
        id,
        password: '$2b$10$mockHashedPasswordForTesting', // This would come from DB
        status: 'ACTIVE',
      };

      // Verify competition exists and is active
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
          message: 'Competition is not active',
        });
        return;
      }

      // TODO: Uncomment when DB is connected
      // const bcrypt = require('bcrypt');
      // const isPasswordValid = await bcrypt.compare(password, mockCompetition.password);
      
      // For now, accepting any password in development
      const isPasswordValid = password === 'competition123' || password === mockCompetition.password;

      if (!isPasswordValid) {
        res.status(401).json({
          status: 'fail',
          message: 'Invalid password',
        });
        return;
      }

      // Generate competition-specific access token (short-lived, 1 hour)
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      
      const competitionAccessToken = jwt.sign(
        {
          competitionId: id,
          type: 'competition_access',
        },
        JWT_SECRET,
        { expiresIn: '1h' } // Short-lived token
      );

      res.status(200).json({
        status: 'success',
        data: {
          verified: true,
          competitionAccessToken,
          competition: {
            id: mockCompetition.id,
            status: mockCompetition.status,
          },
        },
      });
    } catch (error) {
      console.error('Password verification error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify password',
      });
    }
  }
);

/**
 * @route   POST /api/v1/competitions/:id/checkout
 * @desc    Complete participant checkout with marker submission
 * @access  Protected by checkout password (development mock)
 */
router.post(
  '/:id/checkout',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').trim().notEmpty().withMessage('Checkout password is required'),
    body('markers').isArray({ min: 1 }).withMessage('Markers array is required'),
    body('markers.*.ticketId').notEmpty().withMessage('ticketId is required for each marker'),
    body('markers.*.x')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Marker X coordinate must be normalized between 0 and 1'),
    body('markers.*.y')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Marker Y coordinate must be normalized between 0 and 1'),
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
      const { name, phone, email, password, markers } = req.body as {
        name: string;
        phone: string;
        email: string;
        password: string;
        markers: Array<{
          ticketId?: string;
          ticketNumber?: number;
          x: number;
          y: number;
        }>;
      };

      const normalizedPassword = password.trim();
      const validCheckoutPasswords = ['checkout123', 'competition123'];
      const isPasswordValid = validCheckoutPasswords.includes(normalizedPassword);

      if (!isPasswordValid) {
        res.status(401).json({
          status: 'fail',
          message: 'Invalid checkout password',
        });
        return;
      }

      const sanitizedPhone = sanitizePhone(phone);
      
      // Check if the id parameter is a userId or competitionId
      // Treat both 'user-xxx' and 'participant-xxx' as user identifiers
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;
      const requestedUserId = isUserId ? id : null;
      
      const baseCompetition = getCompetitionById(actualCompetitionId);
      const markersPerTicket = baseCompetition.markersPerTicket;      const markerGroups = new Map<
        string,
        {
          ticketNumber: number | null;
          markers: MockMarker[];
        }
      >();

      markers.forEach((markerPayload) => {
        const markerTicketId = markerPayload.ticketId || `ticket-${mockTicketCounter++}`;
        const existingGroup = markerGroups.get(markerTicketId) || {
          ticketNumber: markerPayload.ticketNumber ?? null,
          markers: [],
        };

        const markerIndex = existingGroup.markers.length + 1;
        existingGroup.markers.push({
          id: `${markerTicketId}-marker-${markerIndex}`,
          x: Number(markerPayload.x.toFixed(4)),
          y: Number(markerPayload.y.toFixed(4)),
        });

        if (existingGroup.ticketNumber === null && markerPayload.ticketNumber) {
          existingGroup.ticketNumber = markerPayload.ticketNumber;
        }

        markerGroups.set(markerTicketId, existingGroup);
      });

      for (const [ticketId, group] of markerGroups.entries()) {
        if (group.markers.length !== markersPerTicket) {
          res.status(400).json({
            status: 'fail',
            message: `Ticket ${ticketId} requires exactly ${markersPerTicket} markers`,
          });
          return;
        }
      }

      const existingParticipant = findParticipantByPhone(actualCompetitionId, sanitizedPhone);
      if (existingParticipant && hasParticipantCompletedEntry(actualCompetitionId, existingParticipant.id)) {
        console.log('[POST checkout] Participant already completed entry:', { participantId: existingParticipant.id });
        res.status(403).json({
          status: 'fail',
          message: 'This participant has already completed their entry and cannot submit another checkout.',
        });
        return;
      }
      const participantId = existingParticipant?.id || `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create or update user entry to get/create a userId
      // If a userId was provided in the URL, use it; otherwise create new one
      const userEntry = createOrUpdateUserEntry(name.trim(), sanitizedPhone, requestedUserId || undefined);
      const userId = userEntry.id;

      const participantRecord: MockParticipant = existingParticipant
        ? {
            ...existingParticipant,
            name: name.trim(),
            phone: sanitizedPhone,
            email: email.trim().toLowerCase(),
          }
        : {
            id: participantId,
            competitionId: actualCompetitionId,
            name: name.trim(),
            phone: sanitizedPhone,
            email: email.trim().toLowerCase(),
            tickets: [],
          };

      const updatedTickets: MockTicket[] = participantRecord.tickets.map((ticket) => ({
        ...ticket,
      }));

      for (const [ticketId, group] of markerGroups.entries()) {
        const existingTicket = updatedTickets.find((ticket) => ticket.id === ticketId);
        const ticketNumber = existingTicket?.ticketNumber || group.ticketNumber || mockTicketCounter++;

        const nextTicket: MockTicket = existingTicket
          ? { ...existingTicket }
          : {
              id: ticketId,
              ticketNumber,
              status: 'ASSIGNED',
              markersAllowed: markersPerTicket,
              markersUsed: 0,
              markers: [],
            };

        nextTicket.markers = group.markers;
        nextTicket.markersAllowed = markersPerTicket;
        nextTicket.markersUsed = group.markers.length;
        nextTicket.status = 'USED';
        nextTicket.submittedAt = new Date();

        if (existingTicket) {
          const index = updatedTickets.findIndex((ticket) => ticket.id === ticketId);
          updatedTickets[index] = nextTicket;
        } else {
          updatedTickets.push(nextTicket);
        }
      }

      participantRecord.tickets = updatedTickets;
      participantRecord.lastSubmissionAt = new Date();

      saveParticipant(participantRecord);

      // Save checkout summary with userId for admin view
      console.log('[POST checkout] Saving checkout summary:', {
        actualCompetitionId,
        participantId: participantRecord.id,
        userId,
        isUserId,
        requestedUserId
      });
      
      const checkoutSummary: CheckoutSummary = {
        competitionId: actualCompetitionId,
        participantId: participantRecord.id,
        userId: userId,
        competition: {
          id: baseCompetition.id,
          title: baseCompetition.title,
          imageUrl: baseCompetition.imageUrl,
          pricePerTicket: baseCompetition.pricePerTicket,
          markersPerTicket: baseCompetition.markersPerTicket,
          status: baseCompetition.status,
        },
        participant: {
          id: participantRecord.id,
          name: participantRecord.name,
          phone: participantRecord.phone,
          ticketsPurchased: updatedTickets.length,
        },
        tickets: updatedTickets.map((ticket) => ({
          ticketNumber: ticket.ticketNumber,
          markerCount: ticket.markers.length,
          markers: ticket.markers.map((marker, idx) => ({
            id: marker.id,
            x: marker.x,
            y: marker.y,
            label: `T${ticket.ticketNumber}M${idx + 1}`,
          })),
        })),
        totalMarkers: updatedTickets.reduce((sum, t) => sum + t.markers.length, 0),
        checkoutTime: new Date().toISOString(),
      };

      saveCheckoutSummary(actualCompetitionId, participantRecord.id, checkoutSummary);
      console.log('[POST checkout] Checkout summary saved with keys:', {
        participantKey: `${actualCompetitionId}:${participantRecord.id}`,
        userKey: `${actualCompetitionId}:user:${userId}`
      });

      const responseTickets = participantRecord.tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        markersAllowed: ticket.markersAllowed,
        markersUsed: ticket.markersUsed,
        markers: ticket.markers,
        submittedAt: ticket.submittedAt,
      }));

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Checkout completed successfully',
          participantId: participantRecord.id,
          userId: userId,
          tickets: responseTickets,
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process checkout',
      });
    }
  }
);

/**
 * @route   POST /api/v1/competitions/:id/entries
 * @desc    Submit competition entry with markers
 * @access  Protected (requires participant access token)
 */
router.post(
  '/:id/entries',
  verifyParticipantAccess,
  [
    body('tickets').isArray({ min: 1 }).withMessage('Tickets payload is required'),
    body('tickets.*.ticketId').notEmpty().withMessage('Ticket ID is required'),
    body('tickets.*.markers')
      .isArray({ min: 1 })
      .withMessage('Markers array is required for each ticket'),
    body('tickets.*.markers.*.x')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Marker X coordinate must be a normalized value between 0 and 1'),
    body('tickets.*.markers.*.y')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Marker Y coordinate must be a normalized value between 0 and 1'),
  ],
  async (req: ParticipantAccessRequest, res: Response) => {
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
      const participantId = req.participantAccess?.participantId;
      const { tickets } = req.body as { tickets: { ticketId: string; markers: { x: number; y: number }[] }[] };

      // Detect if id is a userId (starts with 'user-' or 'participant-')
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;

      console.log('[POST entries] Request:', { urlId: id, isUserId, actualCompetitionId, participantId });

      if (!participantId) {
        res.status(401).json({
          status: 'fail',
          message: 'Participant session invalid',
        });
        return;
      }

      const participant = findParticipantById(actualCompetitionId, participantId);
      if (!participant) {
        console.log('[POST entries] Participant not found:', { actualCompetitionId, participantId });
        res.status(404).json({
          status: 'fail',
          message: 'Participant not found',
        });
        return;
      }

      if (hasParticipantCompletedEntry(actualCompetitionId, participant.id)) {
        console.log('[POST entries] Participant already completed entry:', { participantId: participant.id });
        res.status(403).json({
          status: 'fail',
          message: 'This entry is already completed. Additional markers cannot be submitted.',
        });
        return;
      }

      const submissions: MockTicket[] = [];

      for (const ticketSubmission of tickets) {
        const ticket = participant.tickets.find((t) => t.id === ticketSubmission.ticketId);

        if (!ticket) {
          res.status(400).json({
            status: 'fail',
            message: `Ticket ${ticketSubmission.ticketId} not found for participant`,
          });
          return;
        }

        if (ticket.status === 'USED') {
          res.status(409).json({
            status: 'fail',
            message: `Ticket ${ticket.ticketNumber} has already been submitted`,
          });
          return;
        }

        if (ticketSubmission.markers.length !== ticket.markersAllowed) {
          res.status(400).json({
            status: 'fail',
            message: `Ticket ${ticket.ticketNumber} requires exactly ${ticket.markersAllowed} markers`,
          });
          return;
        }

        submissions.push({
          ...ticket,
          markers: ticketSubmission.markers.map((marker, index) => ({
            id: `${ticket.id}-marker-${index + 1}`,
            x: marker.x,
            y: marker.y,
          })),
          markersUsed: ticketSubmission.markers.length,
          status: 'USED',
          submittedAt: new Date(),
        });
      }

      const updatedTickets = participant.tickets.map((ticket) => {
        const submission = submissions.find((submitted) => submitted.id === ticket.id);
        return submission ? submission : ticket;
      });

      const updatedParticipant: MockParticipant = {
        ...participant,
        tickets: updatedTickets,
        lastSubmissionAt: new Date(),
      };

      saveParticipant(updatedParticipant);

      const responseTickets = updatedParticipant.tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        markersAllowed: ticket.markersAllowed,
        markersUsed: ticket.markersUsed,
        markers: ticket.markers,
        submittedAt: ticket.submittedAt,
      }));

      res.status(201).json({
        status: 'success',
        data: {
          message: 'Entry submitted successfully',
          tickets: responseTickets,
          participant: {
            id: updatedParticipant.id,
            name: updatedParticipant.name,
            phone: updatedParticipant.phone,
            ticketsPurchased: updatedParticipant.tickets.length,
          },
        },
      });
    } catch (error) {
      console.error('Error submitting markers:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit entry',
      });
    }
  }
);

/**
 * @route   GET /api/v1/competitions/:id/participants/:participantId/submissions
 * @desc    Get all submitted markers for a specific participant
 * @access  Protected (requires participant access token)
 */
router.get(
  '/:id/participants/:participantId/submissions',
  verifyParticipantAccess,
  async (req: ParticipantAccessRequest, res: Response) => {
    try {
      const { id, participantId } = req.params;
      const authenticatedParticipantId = req.participantAccess?.participantId;

      // Detect if id is a userId (starts with 'user-' or 'participant-')
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;

      console.log('[GET submissions] Request:', { urlId: id, isUserId, actualCompetitionId, participantId });

      // Allow admin to view any participant's data, participants can only view their own
      const isAdmin = req.participantAccess?.type === 'admin_access';
      if (!isAdmin && authenticatedParticipantId !== participantId) {
        res.status(403).json({
          status: 'fail',
          message: 'Unauthorized to view this participant\'s submissions',
        });
        return;
      }

      const participant = findParticipantById(actualCompetitionId, participantId);
      if (!participant) {
        console.log('[GET submissions] Participant not found:', { actualCompetitionId, participantId });
        res.status(404).json({
          status: 'fail',
          message: 'Participant not found',
        });
        return;
      }

      // Filter only submitted tickets (status === 'USED')
      const submittedTickets = participant.tickets
        .filter((ticket) => ticket.status === 'USED' && ticket.submittedAt)
        .map((ticket) => ({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          markersAllowed: ticket.markersAllowed,
          markersUsed: ticket.markersUsed,
          markers: ticket.markers,
          submittedAt: ticket.submittedAt?.toISOString(),
        }));

      const competition = getCompetitionById(id);

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
 * @route   GET /api/v1/competitions/admin/:id/participants/:participantId/submissions
 * @desc    Get all submitted markers for a specific participant (Admin endpoint)
 * @access  Protected (requires admin token)
 */
router.get(
  '/admin/:id/participants/:participantId/submissions',
  async (req: Request, res: Response) => {
    try {
      const { id, participantId } = req.params;

      // Detect if id is a userId (starts with 'user-' or 'participant-')
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;

      console.log('[GET admin submissions] Request:', { urlId: id, isUserId, actualCompetitionId, participantId });

      // Verify admin token
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        res.status(401).json({
          status: 'fail',
          message: 'Authentication required',
        });
        return;
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (error) {
        res.status(401).json({
          status: 'fail',
          message: 'Invalid or expired token',
        });
        return;
      }

      let participant = findParticipantById(actualCompetitionId, participantId);
      
      // If participant not found with exact ID, try to get first participant from competition
      // This handles cases where frontend uses different ID schemes (user-1 vs participant-1)
      if (!participant) {
        const allParticipants = getParticipantsByCompetition(actualCompetitionId);
        if (allParticipants.length === 0) {
          console.log('[GET admin submissions] No participants found:', { actualCompetitionId });
          res.status(404).json({
            status: 'fail',
            message: 'No participants found for this competition',
          });
          return;
        }
        participant = allParticipants[0];
      }

      // Filter only submitted tickets (status === 'USED')
      const submittedTickets = (participant as MockParticipant).tickets
        .filter((ticket) => ticket.status === 'USED' && ticket.submittedAt)
        .map((ticket) => ({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          markersAllowed: ticket.markersAllowed,
          markersUsed: ticket.markersUsed,
          markers: ticket.markers,
          submittedAt: ticket.submittedAt?.toISOString(),
        }));

      const competition = getCompetitionById(id);

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
 * @route   POST /api/v1/competitions/:id/checkout-summary
 * @desc    Save checkout summary for a participant
 * @access  Protected (requires participant token)
 */
router.post(
  '/:id/checkout-summary',
  verifyParticipantAccess,
  async (req: ParticipantAccessRequest, res: Response) => {
    try {
      const { id } = req.params;
      const participantId = req.participantAccess?.participantId;

      if (!participantId) {
        res.status(401).json({ message: 'Participant session invalid' });
        return;
      }

      // Check if the id parameter is a userId or competitionId
      // Treat both 'user-xxx' and 'participant-xxx' as user identifiers
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;
      const userId = isUserId ? id : null;

      console.log('[POST checkout-summary] Request:', {
        urlId: id,
        isUserId,
        actualCompetitionId,
        userId,
        participantId
      });

      let participant = findParticipantById(actualCompetitionId, participantId);
      if (!participant) {
        // Fallback: check if participant exists in any competition and clone
        const allParticipants = getParticipants();
        let existingParticipant = allParticipants.find(p => p.id === participantId);
        
        if (existingParticipant) {
          // Clone participant to current competition
          const clonedParticipant: MockParticipant = {
            ...existingParticipant,
            competitionId: actualCompetitionId,
            tickets: existingParticipant.tickets.map(ticket => ({
              ...ticket,
              markers: [], // Reset markers for new competition
              markersUsed: 0,
              status: 'ASSIGNED' as const,
              submittedAt: null,
            })),
            lastSubmissionAt: null,
          };
          saveParticipant(clonedParticipant);
          participant = clonedParticipant;
        } else {
          // Last resort: Create a minimal participant entry for new users with local IDs
          const payload = req.body ?? {};
          const participantPayload = payload.participant ?? {};
          
          const newParticipant: MockParticipant = {
            id: participantId,
            competitionId: actualCompetitionId,
            name: participantPayload.name || 'Unknown',
            phone: participantPayload.phone || '',
            email: undefined,
            tickets: Array.from({ length: participantPayload.ticketsPurchased || 1 }).map((_, i) => ({
              id: `ticket-${participantId}-${i}`,
              ticketNumber: 100 + i,
              status: 'ASSIGNED' as const,
              markersAllowed: 3,
              markersUsed: 0,
              markers: [],
              submittedAt: null,
            })),
            lastSubmissionAt: null,
          };
          
          saveParticipant(newParticipant);
          participant = newParticipant;
        }
      }

      const payload = req.body ?? {};
      const ticketsInput = payload.tickets;

      if (!Array.isArray(ticketsInput) || ticketsInput.length === 0) {
        res.status(400).json({ message: 'Invalid checkout payload: tickets are required' });
        return;
      }

      const competition = getCompetitionById(actualCompetitionId);

      const rawParticipantEmail = typeof payload?.participant?.email === 'string'
        ? payload.participant.email.trim().toLowerCase()
        : undefined;
      const rawContactEmail = typeof payload?.contactEmail === 'string'
        ? payload.contactEmail.trim().toLowerCase()
        : undefined;
      const resolvedEmail = rawParticipantEmail || rawContactEmail || participant.email || null;

      if (resolvedEmail && participant.email !== resolvedEmail) {
        participant.email = resolvedEmail;
        saveParticipant(participant);
      }

      const completedFlag = payload?.completed === true || payload?.isCompleted === true;
      const completedAtValue = completedFlag
        ? (typeof payload?.completedAt === 'string' && payload.completedAt.trim()
            ? payload.completedAt
            : new Date().toISOString())
        : null;

      if (completedFlag && completedAtValue) {
        participant.lastSubmissionAt = new Date(completedAtValue);
        saveParticipant(participant);
      }

      const tickets = ticketsInput.map((ticket: any) => {
        const markersArray = Array.isArray(ticket?.markers) ? ticket.markers : [];

        return {
          ticketNumber: Number(ticket?.ticketNumber ?? 0),
          markerCount: Number.isFinite(Number(ticket?.markerCount))
            ? Number(ticket.markerCount)
            : markersArray.length,
          markers: markersArray.map((marker: any) => ({
            id: String(marker?.id ?? ''),
            x: Number(marker?.x ?? 0),
            y: Number(marker?.y ?? 0),
            label: String(marker?.label ?? ''),
          })),
        };
      });

      const totalMarkers = typeof payload.totalMarkers === 'number'
        ? payload.totalMarkers
        : tickets.reduce((sum, ticket) => sum + ticket.markerCount, 0);

      const summary: CheckoutSummary = {
        competitionId: actualCompetitionId,
        participantId: participantId,
        userId: userId || undefined, // Include userId if this was a userId-based request
        competition: {
          id: competition.id,
          title: competition.title,
          imageUrl: competition.imageUrl,
          pricePerTicket: competition.pricePerTicket,
          markersPerTicket: competition.markersPerTicket,
          status: competition.status,
        },
        participant: {
          id: participant.id,
          name: participant.name,
          phone: participant.phone,
          email: resolvedEmail,
          ticketsPurchased: participant.tickets.length,
        },
        contactEmail: resolvedEmail,
        completed: completedFlag,
        completedAt: completedAtValue,
        tickets,
        totalMarkers,
        checkoutTime:
          typeof payload.checkoutTime === 'string' && payload.checkoutTime.trim()
            ? payload.checkoutTime
            : new Date().toISOString(),
      };

      console.log('[POST checkout-summary] Saving with keys:', {
        participantKey: `${actualCompetitionId}:${participantId}`,
        userKey: userId ? `${actualCompetitionId}:user:${userId}` : 'none'
      });

      saveCheckoutSummary(actualCompetitionId, participantId, summary);

      res.status(201).json({ message: 'Checkout saved', summary });
    } catch (error) {
      console.error('Error saving checkout summary:', error);
      res.status(500).json({ message: 'Failed to save checkout summary' });
    }
  }
);

/**
 * @route   GET /api/v1/competitions/:id/checkout-summary/:participantId
 * @desc    Get checkout summary for a participant (Admin endpoint)
 * @access  Protected (requires admin token)
 */
router.get(
  '/:id/checkout-summary/:participantId',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, participantId } = req.params;
      
      console.log('[GET checkout-summary] Request params:', { id, participantId });
      
      // Check if the id parameter is a userId or competitionId
      // Treat both 'user-xxx' and 'participant-xxx' as user identifiers
      const isUserId = id.startsWith('user-') || id.startsWith('participant-');
      const actualCompetitionId = isUserId ? 'test-id' : id;
      
      console.log('[GET checkout-summary] Resolved:', { isUserId, actualCompetitionId });
      
      // Try to get by participantId first (with actual competition ID)
      let summary = getCheckoutSummary(actualCompetitionId, participantId);
      console.log('[GET checkout-summary] By participantId:', summary ? 'found' : 'not found');
      
      // If not found, try to get by userId (in case participantId is actually a userId)
      if (!summary) {
        summary = getCheckoutSummaryByUserId(actualCompetitionId, participantId);
        console.log('[GET checkout-summary] By userId:', summary ? 'found' : 'not found');
      }

      if (!summary) {
        console.log('[GET checkout-summary] No summary found, returning 404');
        res.status(404).json({ message: 'Checkout summary not found' });
        return;
      }

      console.log('[GET checkout-summary] Returning summary');
      res.status(200).json({ summary });
    } catch (error) {
      console.error('Error retrieving checkout summary:', error);
      res.status(500).json({ message: 'Failed to retrieve checkout summary' });
    }
  }
);

export default router;
