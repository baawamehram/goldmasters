import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import { error } from '@/server/http';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tokenOrResponse = requireAdminToken(req);
    if (tokenOrResponse instanceof Response) {
      return tokenOrResponse;
    }

    const { id } = await context.params;
    const authHeader = req.headers.get('authorization');

    const response = await fetch(
      `http://localhost:4000/api/v1/admin/competitions/${id}/results`,
      {
        headers: {
          'Authorization': authHeader ?? '',
        },
      }
    );

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err) {
    console.error('Failed to fetch results', err);
    return error('Failed to fetch results');
  }
}
