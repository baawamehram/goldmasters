import { NextRequest } from 'next/server';
import { logoutUserEntry } from '@/server/data/mockDb';
import { fieldError, validationFailure, success, error, ValidationError } from '@/server/http';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body as { phone?: string };

    const errors: ValidationError[] = [];

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      errors.push(fieldError('phone', 'Phone number is required', phone));
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    // Mark user as logged out
    const userEntry = logoutUserEntry(phone!.trim());

    return success({
      message: 'Logged out successfully',
      user: userEntry ? {
        id: userEntry.id,
        name: userEntry.name,
        phone: userEntry.phone,
        isLoggedIn: userEntry.isLoggedIn,
        lastLogoutAt: userEntry.lastLogoutAt?.toISOString() || null,
      } : null,
    });
  } catch (err) {
    console.error('Participant logout error', err);
    return error('Failed to logout participant');
  }
}
