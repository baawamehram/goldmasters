import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  getCompetitionsWithStats,
  createCompetition,
} from '@/server/data/db.service';
import {
  success,
  error,
  validationFailure,
  fieldError,
  ValidationError,
} from '@/server/http';

// Add OPTIONS handler for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const competitions = await getCompetitionsWithStats();
    return success({ competitions });
  } catch (err) {
    console.error('Error fetching competitions', err);
    return error('Failed to fetch competitions');
  }
}

export async function POST(req: NextRequest) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const body = await req.json();
    const {
      title,
      maxEntries,
      invitePassword,
      imageUrl,
      pricePerTicket,
      markersPerTicket,
      endsAt,
    } = body as {
      title?: string;
      maxEntries?: number;
      invitePassword?: string;
      imageUrl?: string;
      pricePerTicket?: number;
      markersPerTicket?: number;
      endsAt?: string;
    };

    const errors: ValidationError[] = [];

    if (!title || typeof title !== 'string' || !title.trim()) {
      errors.push(fieldError('title', 'Title is required', title));
    }

    if (typeof maxEntries !== 'number' || !Number.isInteger(maxEntries) || maxEntries < 1) {
      errors.push(fieldError('maxEntries', 'maxEntries must be at least 1', maxEntries));
    }

    if (!invitePassword || typeof invitePassword !== 'string' || !invitePassword.trim()) {
      errors.push(fieldError('invitePassword', 'Invite password is required', invitePassword));
    }

    const isValidUrl = typeof imageUrl === 'string' && /^https?:\/\//.test(imageUrl);
    if (!isValidUrl) {
      errors.push(fieldError('imageUrl', 'Valid image URL is required', imageUrl));
    }

    if (pricePerTicket !== undefined) {
      if (typeof pricePerTicket !== 'number' || pricePerTicket < 0) {
        errors.push(fieldError('pricePerTicket', 'pricePerTicket must be a positive number', pricePerTicket));
      }
    }

    if (markersPerTicket !== undefined) {
      if (
        typeof markersPerTicket !== 'number' ||
        !Number.isInteger(markersPerTicket) ||
        markersPerTicket < 1
      ) {
        errors.push(
          fieldError('markersPerTicket', 'markersPerTicket must be at least 1', markersPerTicket)
        );
      }
    }

    if (endsAt !== undefined) {
      const endsAtDate = new Date(endsAt);
      if (Number.isNaN(endsAtDate.getTime())) {
        errors.push(fieldError('endsAt', 'endsAt must be a valid ISO date string', endsAt));
      }
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    const competition = await createCompetition({
      title: title!,
      maxEntries: maxEntries!,
      invitePassword: invitePassword!,
      imageUrl: imageUrl!,
      pricePerTicket,
      markersPerTicket,
      endsAt,
    });

    return success({ competition }, 201);
  } catch (err) {
    console.error('Error creating competition', err);
    return error('Failed to create competition');
  }
}
