import { NextResponse } from 'next/server';

export class ApiError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorResponse(error: any, defaultMessage: string = 'Internal server error') {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    console.error('❌ API Error:', error);
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        status: error.status,
        message: error.message,
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      status: 'error',
      message: defaultMessage,
      ...(isDevelopment && { error: error?.message, stack: error?.stack }),
    },
    { status: 500 }
  );
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(
    {
      status: 'success',
      data,
    },
    { status }
  );
}

export function failResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      status: 'fail',
      message,
    },
    { status }
  );
}
