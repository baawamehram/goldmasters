import { NextResponse } from 'next/server';

export type ValidationError = {
  type: 'field';
  path: string;
  msg: string;
  value?: unknown;
  location: 'body';
};

export const success = (data: unknown, status = 200) =>
  NextResponse.json({ status: 'success', data }, { status });

export const fail = (
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) =>
  NextResponse.json({ status: 'fail', message, ...(extra || {}) }, { status });

export const validationFailure = (
  errors: ValidationError[],
  status = 400
) =>
  NextResponse.json({ status: 'fail', errors }, { status });

export const fieldError = (
  path: string,
  msg: string,
  value?: unknown
): ValidationError => ({
  type: 'field',
  path,
  msg,
  value,
  location: 'body',
});

export const error = (message: string, status = 500) =>
  NextResponse.json({ status: 'error', message }, { status });

export const json = (payload: unknown, status = 200) =>
  NextResponse.json(payload, { status });
