import type { RequestHandler } from 'express';
import { UserModel } from '../models/User';
import { verifyAuthToken } from '../utils/auth.util';

export const requireAuth: RequestHandler = async (req, res, next) => {
  const authorization = req.get('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const userId = token ? verifyAuthToken(token) : null;

  if (!userId) {
    res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción.' });
    return;
  }

  try {
    const user = await UserModel.findById(userId).select('_id role');
    if (!user) {
      res.status(401).json({ error: 'La cuenta asociada a esta sesión ya no existe.' });
      return;
    }

    res.locals.userId = user.id;
    res.locals.userRole = user.role;
    next();
  } catch (error) {
    console.error('Error al validar la sesión:', error);
    res.status(500).json({ error: 'No se pudo validar la sesión.' });
  }
};

export function requireRole(...roles: Array<'client' | 'artist' | 'admin'>): RequestHandler {
  return (_req, res, next) => {
    if (!roles.includes(res.locals.userRole)) {
      res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
      return;
    }
    next();
  };
}
