import { NextRequest } from 'next/server';
import { fieldError, validationFailure, success, error, ValidationError } from '@/server/http';

const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { competitionId, name, email, phone } = body as {
      competitionId?: string;
      name?: string;
      email?: string;
      phone?: string;
    };

    const errors: ValidationError[] = [];

    if (!competitionId || typeof competitionId !== 'string' || !competitionId.trim()) {
      errors.push(fieldError('competitionId', 'Competition ID is required', competitionId));
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push(fieldError('name', 'Name is required', name));
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      errors.push(fieldError('email', 'Valid email is required', email));
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      errors.push(fieldError('phone', 'Phone number is required', phone));
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    console.log('Registering participant:', { competitionId, name, email, phone });

    return success({
      participantId: 'generated-participant-id',
      message: 'Registration successful',
    }, 201);
  } catch (err) {
    console.error('Failed to register participant', err);
    return error('Failed to register participant');
  }
}
