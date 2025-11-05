import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

export type TokenPayload = JwtPayload & {
  type: string;
};

export const extractBearerToken = (authorizationHeader: string | null): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const verifyToken = <T extends TokenPayload>(token: string): T => {
  return jwt.verify(token, JWT_SECRET) as T;
};

export const signToken = (payload: TokenPayload, options?: SignOptions): string => {
  return jwt.sign(payload, JWT_SECRET, options);
};
