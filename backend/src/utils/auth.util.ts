import jwt from 'jsonwebtoken';

export function createAuthToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }
  return jwt.sign({}, secret, { subject: userId, expiresIn: '7d' });
}

export function verifyAuthToken(token: string): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }

  try {
    const payload = jwt.verify(token, secret);
    return typeof payload === 'string' ? null : payload.sub || null;
  } catch {
    return null;
  }
}
