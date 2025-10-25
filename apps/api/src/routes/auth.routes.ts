import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router: Router = Router();

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
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
      const { username, password } = req.body as { username: string; password: string };

      const adminUsername = process.env.ADMIN_USERNAME || 'wish-admin';
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      const fallbackPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username.trim() !== adminUsername) {
        res.status(401).json({
          status: 'fail',
          message: 'Invalid credentials',
        });
        return;
      }

      let passwordMatches = false;

      if (adminPasswordHash) {
        try {
          passwordMatches = await bcrypt.compare(password, adminPasswordHash);
        } catch (compareError) {
          console.error('Error comparing admin password hash', compareError);
        }
      }

      if (!passwordMatches && fallbackPassword) {
        passwordMatches = password === fallbackPassword;
      }

      if (!passwordMatches) {
        res.status(401).json({
          status: 'fail',
          message: 'Invalid credentials',
        });
        return;
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        {
          sub: 'admin',
          username: adminUsername,
          role: 'ADMIN',
          type: 'admin_token',
        },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.status(200).json({
        status: 'success',
        data: {
          token,
          admin: {
            username: adminUsername,
            role: 'ADMIN',
          },
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to authenticate admin',
      });
    }
  }
);

export default router;
