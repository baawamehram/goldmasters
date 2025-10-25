import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import {
  verifyParticipantAccess,
  ParticipantAccessRequest,
} from '../middleware/competitionAccess';
import {
  MockMarker,
  MockParticipant,
  MockTicket,
  calculateTicketsSold,
  findParticipantById,
  findParticipantByPhone,
  getCompetitionById,
  getCompetitionsWithStats,
  sanitizePhone,
  saveParticipant,
} from '../data/mockDb';

const router: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
let mockTicketCounter = 200;

/**
 * @route   GET /api/v1/competitions
 * @desc    Get all active competitions
 * @access  Public
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const competitions = getCompetitionsWithStats();
    res.status(200).json({
      status: 'success',
      data: {
        competitions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch competitions',
    });
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

    // Check for optional access token (competition or participant)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let participantId: string | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const tokenMatchesCompetition = decoded.competitionId === id;
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

  const baseCompetition = getCompetitionById(id);
  const ticketsSold = calculateTicketsSold(id);
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
      const participant = findParticipantById(id, participantId);
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

      const participant = findParticipantByPhone(id, phone);
      if (!participant) {
        res.status(404).json({
          status: 'fail',
          message: 'Participant not found. Please contact support.',
        });
        return;
      }

      const normalizedInputName = (name as string).trim().toLowerCase();
      const storedName = participant.name.trim().toLowerCase();
      if (normalizedInputName !== storedName) {
        res.status(401).json({
          status: 'fail',
          message: 'Participant details do not match. Please try again or contact support.',
        });
        return;
      }

      const participantAccessToken = jwt.sign(
        {
          competitionId: id,
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

      if (!participantId) {
        res.status(401).json({
          status: 'fail',
          message: 'Participant session invalid',
        });
        return;
      }

      const participant = findParticipantById(id, participantId);
      if (!participant) {
        res.status(404).json({
          status: 'fail',
          message: 'Participant record not found',
        });
        return;
      }

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
  const baseCompetition = getCompetitionById(id);
      const markersPerTicket = baseCompetition.markersPerTicket;

      const markerGroups = new Map<
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

      const existingParticipant = findParticipantByPhone(id, sanitizedPhone);
      const participantId = existingParticipant?.id || `participant-${Date.now()}`;

      const participantRecord: MockParticipant = existingParticipant
        ? {
            ...existingParticipant,
            name: name.trim(),
            phone: sanitizedPhone,
            email: email.trim().toLowerCase(),
          }
        : {
            id: participantId,
            competitionId: id,
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

      if (!participantId) {
        res.status(401).json({
          status: 'fail',
          message: 'Participant session invalid',
        });
        return;
      }

      const participant = findParticipantById(id, participantId);
      if (!participant) {
        res.status(404).json({
          status: 'fail',
          message: 'Participant not found',
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

export default router;
