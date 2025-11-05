import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_PASSWORD_HASH } from '@/server/config';
import { fieldError, validationFailure, fail, success, error, ValidationError } from '@/server/http';
import { signToken } from '@/server/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as { username?: string; password?: string };

    const errors: ValidationError[] = [];

    if (!username || typeof username !== 'string' || !username.trim()) {
      errors.push(fieldError('username', 'Username is required', username));
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      errors.push(fieldError('password', 'Password is required', password));
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

  const trimmedUsername = username!.trim();
  const providedPassword = password!;

  if (trimmedUsername !== ADMIN_USERNAME) {
      return fail('Invalid credentials', 401);
    }

    let passwordMatches = false;

    if (ADMIN_PASSWORD_HASH) {
      try {
  passwordMatches = await bcrypt.compare(providedPassword, ADMIN_PASSWORD_HASH);
      } catch (compareError) {
        console.error('Error comparing admin password hash', compareError);
      }
    }

    if (!passwordMatches && ADMIN_PASSWORD) {
  passwordMatches = providedPassword === ADMIN_PASSWORD;
    }

    if (!passwordMatches) {
      return fail('Invalid credentials', 401);
    }

    const token = signToken(
      {
        sub: 'admin',
        username: ADMIN_USERNAME,
        role: 'ADMIN',
        type: 'admin_token',
      },
      { expiresIn: '12h' }
    );

    return success({
      token,
      admin: {
        username: ADMIN_USERNAME,
        role: 'ADMIN',
      },
    });
  } catch (err) {
    console.error('Admin login error', err);
    return error('Failed to authenticate admin');
  }
}
