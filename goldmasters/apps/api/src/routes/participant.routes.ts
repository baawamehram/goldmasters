import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import {
  findParticipantsByPhone,
  getCompetitionsByIds,
  sanitizePhone,
} from '../data/mockDb';

const router: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @route   POST /api/v1/participants/login
 * @desc    Authenticate participant by phone and return accessible competitions
 * @access  Public
 */
router.post(
  '/login',
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('isAdult')
      .isBoolean()
      .withMessage('Age confirmation must be provided')
      .custom((value) => value === true)
      .withMessage('You must confirm that you are 18 years or older'),
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
      const { phone } = req.body as { phone: string };
      const participants = findParticipantsByPhone(phone);

      if (participants.length === 0) {
        res.status(404).json({
          status: 'fail',
          message: 'No participant found with the provided phone number.',
        });
        return;
      }

      const uniqueNames = Array.from(
        new Set(participants.map((participant) => participant.name.trim().toLowerCase()))
      );

      if (uniqueNames.length > 1) {
        res.status(409).json({
          status: 'fail',
          message:
            'Multiple participant profiles are linked to this phone number. Please contact support.',
        });
        return;
      }

      const primaryParticipant = participants[0];
      const competitionIds = Array.from(
        new Set(participants.map((participant) => participant.competitionId))
      );

      const competitions = getCompetitionsByIds(competitionIds).map((competition) => ({
        id: competition.id,
        title: competition.title,
        status: competition.status,
        imageUrl: competition.imageUrl,
        pricePerTicket: competition.pricePerTicket,
        markersPerTicket: competition.markersPerTicket,
        endsAt: competition.endsAt.toISOString(),
      }));

      const loginToken = jwt.sign(
        {
          type: 'participant_login',
          phone: sanitizePhone(primaryParticipant.phone),
          participantIds: participants.map((participant) => participant.id),
        },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.status(200).json({
        status: 'success',
        data: {
          token: loginToken,
          participant: {
            id: primaryParticipant.id,
            name: primaryParticipant.name,
            phone: primaryParticipant.phone,
            ticketsPurchased: primaryParticipant.tickets.length,
          },
          competitions,
        },
      });
    } catch (error) {
      console.error('Participant login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to authenticate participant',
      });
    }
  }
);

/**
 * @route   POST /api/v1/participants/register
 * @desc    Register a new participant for a competition
 * @access  Public
 */
router.post(
  '/register',
  [
    body('competitionId').notEmpty().withMessage('Competition ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
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
      const { competitionId, name, email, phone } = req.body;

      // TODO: Save participant to database
      console.log('Registering participant:', { competitionId, name, email, phone });
      
      res.status(201).json({
        status: 'success',
        data: {
          participantId: 'generated-participant-id',
          message: 'Registration successful',
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to register participant',
      });
    }
  }
);

/**
 * @route   GET /api/v1/participants/:id/entries
 * @desc    Get participant's competition entries
 * @access  Public (with participant token)
 */
router.get('/:id/entries', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch entries from database
    console.log('Fetching entries for participant:', id);
    
    res.status(200).json({
      status: 'success',
      data: {
        entries: [],
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch entries',
    });
  }
});

/**
 * @route   POST /api/v1/participants/checkout
 * @desc    Process ticket purchase checkout
 * @access  Public
 */
router.post(
  '/checkout',
  [
    body('competitionId').notEmpty().withMessage('Competition ID is required'),
    body('participantId').notEmpty().withMessage('Participant ID is required'),
    body('numberOfTickets').isInt({ min: 1 }).withMessage('Number of tickets must be at least 1'),
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
      const { competitionId, participantId, numberOfTickets } = req.body;

      // TODO: Process payment and assign tickets
      console.log('Processing checkout:', { competitionId, participantId, numberOfTickets });
      
      res.status(200).json({
        status: 'success',
        data: {
          orderId: 'generated-order-id',
          ticketsAssigned: numberOfTickets,
          totalMarkers: numberOfTickets * 3,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to process checkout',
      });
    }
  }
);

export default router;
