import { NextRequest } from 'next/server';
import { verifyAccessCode } from '@/server/data/mockDb';
import { fieldError, validationFailure, success, fail, error, ValidationError } from '@/server/http';

// Admin universal access code (works for all competitions)
const ADMIN_ACCESS_CODE = '999999';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body as { code?: string };

    const errors: ValidationError[] = [];

    if (!code || typeof code !== 'string' || !code.trim()) {
      errors.push(fieldError('code', 'Access code is required', code));
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    const trimmedCode = code!.trim();

    // Check if it's the admin code
    if (trimmedCode === ADMIN_ACCESS_CODE) {
      return success({
        valid: true,
        user: {
          id: 'admin-access',
          name: 'Admin User',
          phone: 'N/A',
          accessCode: ADMIN_ACCESS_CODE,
          currentPhase: null,
        },
        isAdminCode: true,
      });
    }

    // Verify regular user access code
    const userEntry = verifyAccessCode(trimmedCode);

    if (!userEntry) {
      return fail('Invalid access code. Please check and try again.', 401);
    }

    return success({
      valid: true,
      user: {
        id: userEntry.id,
        name: userEntry.name,
        phone: userEntry.phone,
        accessCode: userEntry.accessCode,
        currentPhase: userEntry.currentPhase,
      },
      isAdminCode: false,
    });
  } catch (err) {
    console.error('Access code verification error', err);
    return error('Failed to verify access code');
  }
}
