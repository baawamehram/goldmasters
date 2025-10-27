import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/competitions/[id]/checkout-summary
 * Proxy to Express API for checkout summary persistence
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { status: 'fail', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const rawBody = await req.text();

    const response = await fetch(
      `http://localhost:4000/api/v1/competitions/${id}/checkout-summary`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': req.headers.get('content-type') ?? 'application/json',
        },
        body: rawBody,
      }
    );

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('Error proxying checkout-summary:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
