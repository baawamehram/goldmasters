import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router: Router = Router();

/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login with JWT
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
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
      const { email, password } = req.body;

      // TODO: Fetch admin from database
      // For now, use environment variables
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@wishmasters.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (email !== adminEmail) {
        res.status(401).json({
          status: 'fail',
          message: 'Invalid credentials',
        });
        return;
      }

      // TODO: Use bcrypt to compare hashed passwords
      const isPasswordValid = password === adminPassword;

      if (!isPasswordValid) {
        res.status(401).json({
          status: 'fail',
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate JWT token
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { id: 'admin-id', email, role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        status: 'success',
        data: {
          token,
          user: {
            email,
            role: 'ADMIN',
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Login failed',
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
    body('description').notEmpty().withMessage('Description is required'),
    body('totalTickets').isInt({ min: 1 }).withMessage('Total tickets must be at least 1'),
    body('markersPerTicket').isInt({ min: 1 }).withMessage('Markers per ticket must be at least 1'),
    body('pricePerTicket').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
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
      const competitionData = req.body;

      // TODO: Save competition to database
      console.log('Creating competition:', competitionData);
      
      res.status(201).json({
        status: 'success',
        data: {
          competitionId: 'generated-competition-id',
          message: 'Competition created successfully',
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create competition',
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

      // TODO: Fetch results from database
      console.log('Fetching results for competition:', id);
      
      res.status(200).json({
        status: 'success',
        data: {
          results: [],
          averageJudgePosition: { x: 0, y: 0 },
        },
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

export default router;
