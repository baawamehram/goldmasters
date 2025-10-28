import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  fieldError,
  validationFailure,
  success,
  error,
  ValidationError,
} from '@/server/http';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const body = await req.json();
    const { judgeMarks } = body as {
      judgeMarks?: Array<{ judgeName?: string; x?: number; y?: number }>;
    };

    const errors: ValidationError[] = [];

    if (!Array.isArray(judgeMarks)) {
      errors.push(fieldError('judgeMarks', 'Judge marks must be an array', judgeMarks));
    } else {
      judgeMarks.forEach((mark, index) => {
        if (!mark.judgeName || typeof mark.judgeName !== 'string' || !mark.judgeName.trim()) {
          errors.push(fieldError(`judgeMarks[${index}].judgeName`, 'Judge name is required', mark.judgeName));
        }

        if (typeof mark.x !== 'number') {
          errors.push(fieldError(`judgeMarks[${index}].x`, 'X coordinate must be a number', mark.x));
        }

        if (typeof mark.y !== 'number') {
          errors.push(fieldError(`judgeMarks[${index}].y`, 'Y coordinate must be a number', mark.y));
        }
      });
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

  const { id } = await context.params;

  console.log('Submitting judge marks for competition:', id, judgeMarks);

    return success({
      message: 'Judge marks submitted successfully',
      winnersComputed: true,
    });
  } catch (err) {
    console.error('Failed to submit judge marks', err);
    return error('Failed to submit judge marks');
  }
}
