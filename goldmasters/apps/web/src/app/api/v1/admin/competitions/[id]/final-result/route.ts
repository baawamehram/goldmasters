import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import { error } from '@/server/http';

export async function PATCH(
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
    const body = await req.text();

    const response = await fetch(
      `http://localhost:4000/api/v1/admin/competitions/${id}/final-result`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': authHeader ?? '',
          'Content-Type': 'application/json',
        },
        body,
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
    console.error('Error saving final result', err);
    return error('Failed to save final result');
  }
}
