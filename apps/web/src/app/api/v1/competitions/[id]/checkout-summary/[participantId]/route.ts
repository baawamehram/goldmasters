import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/competitions/[id]/checkout-summary/[participantId]
 * Proxy to Express API for retrieving checkout summary
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await context.params;
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { status: 'fail', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward to Express API
    const response = await fetch(
      `http://localhost:4000/api/v1/competitions/${id}/checkout-summary/${participantId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying checkout-summary GET:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
