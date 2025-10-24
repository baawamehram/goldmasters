import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router: Router = Router();

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
