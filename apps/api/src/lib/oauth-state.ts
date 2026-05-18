import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
const STATE_TTL = '10m';

export interface OAuthStatePayload {
  userId: string;
  provider: 'google' | 'spotify' | 'googlefit';
}

export function signOAuthState(payload: OAuthStatePayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: STATE_TTL } as jwt.SignOptions);
}

export function verifyOAuthState(token: string, expectedProvider: OAuthStatePayload['provider']): string {
  const decoded = jwt.verify(token, SECRET) as OAuthStatePayload;
  if (decoded.provider !== expectedProvider) {
    throw new Error('Provider mismatch in OAuth state');
  }
  return decoded.userId;
}
