import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface CompetitionAccessRequest extends Request {
  competitionAccess?: {
    competitionId: string;
    type: string;
  };
}

export interface ParticipantAccessRequest extends Request {
  participantAccess?: {
    competitionId: string;
    participantId: string;
    type: string;
  };
}

/**
 * Middleware to verify competition access token
 * Used for competition-specific operations (entering, viewing results, etc.)
 */
export const verifyCompetitionAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      status: 'fail',
      message: 'Competition access token required' 
    });
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify it's a competition access token
    if (decoded.type !== 'competition_access') {
      res.status(403).json({ 
        status: 'fail',
        message: 'Invalid token type' 
      });
      return;
    }

    // Verify competition ID matches route parameter
    const competitionId = req.params.id;
    if (decoded.competitionId !== competitionId) {
      res.status(403).json({ 
        status: 'fail',
        message: 'Token not valid for this competition' 
      });
      return;
    }

    (req as CompetitionAccessRequest).competitionAccess = {
      competitionId: decoded.competitionId,
      type: decoded.type,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        status: 'fail',
        message: 'Competition access token expired. Please re-enter password.' 
      });
      return;
    }
    
    res.status(403).json({ 
      status: 'fail',
      message: 'Invalid or expired token' 
    });
    return;
  }
};

/**
 * Middleware to verify participant access token
 * Ensures participant-specific operations are scoped to a single competition
 */
export const verifyParticipantAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      status: 'fail',
      message: 'Participant access token required',
    });
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'participant_access') {
      res.status(403).json({
        status: 'fail',
        message: 'Invalid token type',
      });
      return;
    }

    const competitionId = req.params.id;
    if (decoded.competitionId !== competitionId) {
      res.status(403).json({
        status: 'fail',
        message: 'Token not valid for this competition',
      });
      return;
    }

    (req as ParticipantAccessRequest).participantAccess = {
      competitionId: decoded.competitionId,
      participantId: decoded.participantId,
      type: decoded.type,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'fail',
        message: 'Participant session expired. Please verify your details again.',
      });
      return;
    }

    res.status(403).json({
      status: 'fail',
      message: 'Invalid or expired participant token',
    });
    return;
  }
};
