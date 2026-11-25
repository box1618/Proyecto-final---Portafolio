import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import type { HydratedDocument } from 'mongoose';
import { UserModel, type IUser } from '../models/User';
import { createAuthToken } from '../utils/auth.util';
import { isValidEmail, parseAdultBirthDate } from '../utils/authValidation';

const publicUser = (user: { id: string; name: string; email: string; role: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const profileUser = (user: HydratedDocument<IUser>): {
  id: string;
  name: string;
  email: string;
  role: IUser['role'];
  handle?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  artistTitle?: string;
  bio?: string;
  responseTime?: string;
} => {
  const profile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
    bio: user.bio
  };
  if (user.role === 'client') return profile;

  return {
    ...profile,
    handle: user.handle || 'artfoliostudio',
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    artistTitle: user.artistTitle || 'Artista digital / concept artist',
    bio: user.bio || 'Diseño mundos, personajes y escenas para historias que merecen ser recordadas.',
    responseTime: user.responseTime || 'Respondo mensajes en 1-2 días hábiles'
  };
};

function publicProfile(profile: NonNullable<Awaited<ReturnType<typeof profileUser>>>) {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    ...(profile.role === 'client'
      ? {}
      : {
          handle: profile.handle,
          avatarUrl: profile.avatarUrl,
          bannerUrl: profile.bannerUrl,
          artistTitle: profile.artistTitle,
          bio: profile.bio,
          responseTime: profile.responseTime
        })
  };
}

export const getMyProfile = async (_req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(res.locals.userId);
    if (!user) return res.status(404).json({ error: 'No se encontró el perfil.' });
    return res.status(200).json({ user: profileUser(user) });
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    return res.status(500).json({ error: 'No se pudo obtener el perfil.' });
  }
};

export const getConfiguredArtistProfile = async (_req: Request, res: Response) => {
  const artistId = process.env.ARTIST_USER_ID;
  if (!artistId) {
    return res.status(503).json({ error: 'El artista todavía no está configurado.' });
  }

  try {
    const user = await UserModel.findById(artistId);
    if (!user || !['artist', 'admin'].includes(user.role)) {
      return res.status(503).json({ error: 'ARTIST_USER_ID debe corresponder a una cuenta de artista o administrador.' });
    }

    return res.status(200).json({ user: publicProfile(profileUser(user)) });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'CastError') {
      return res.status(503).json({ error: 'La configuración del perfil del artista no es válida.' });
    }
    console.error('Error al obtener el perfil del artista:', error);
    return res.status(500).json({ error: 'No se pudo obtener el perfil del artista.' });
  }
};

export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'No se encontró el perfil.' });
    const profile = profileUser(user);
    return res.status(200).json({
      user: publicProfile(profile)
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'CastError') {
      return res.status(404).json({ error: 'No se encontró el perfil.' });
    }
    console.error('Error al obtener el perfil público:', error);
    return res.status(500).json({ error: 'No se pudo obtener el perfil.' });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const data = req.body as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Los datos del perfil no son válidos.' });
  }

  const name = typeof data.name === 'string' ? data.name.trim() : undefined;
  const handle = typeof data.handle === 'string' ? data.handle.trim().replace(/^@/, '') : undefined;
  const artistTitle = typeof data.artistTitle === 'string' ? data.artistTitle.trim() : undefined;
  const bio = typeof data.bio === 'string' ? data.bio.trim() : undefined;
  const responseTime = typeof data.responseTime === 'string' ? data.responseTime.trim() : undefined;
  const role = res.locals.userRole as IUser['role'];

  if (role === 'client' && (artistTitle !== undefined || responseTime !== undefined)) {
    return res.status(403).json({ error: 'Los campos profesionales solo están disponibles para artistas.' });
  }

  if (name !== undefined && (!name || name.length > 50)) {
    return res.status(400).json({ error: 'El nombre debe tener entre 1 y 50 caracteres.' });
  }
  if (handle !== undefined && (!/^[a-zA-Z0-9._-]{1,30}$/.test(handle))) {
    return res.status(400).json({ error: 'El usuario solo puede contener letras, números, puntos, guiones y guion bajo.' });
  }
  if (artistTitle !== undefined && artistTitle.length > 80) {
    return res.status(400).json({ error: 'El título debe tener máximo 80 caracteres.' });
  }
  if (bio !== undefined && bio.length > 300) {
    return res.status(400).json({ error: 'La biografía debe tener máximo 300 caracteres.' });
  }
  if (responseTime !== undefined && responseTime.length > 100) {
    return res.status(400).json({ error: 'El tiempo de respuesta debe tener máximo 100 caracteres.' });
  }

  try {
    const user = await UserModel.findById(res.locals.userId);
    if (!user) return res.status(404).json({ error: 'No se encontró el perfil.' });

    if (name !== undefined) user.name = name;
    if (handle !== undefined) user.handle = handle;
    if (artistTitle !== undefined) user.artistTitle = artistTitle;
    if (bio !== undefined) user.bio = bio;
    if (responseTime !== undefined) user.responseTime = responseTime;
    await user.save();

    return res.status(200).json({ mensaje: 'Perfil actualizado.', user: profileUser(user) });
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el perfil.' });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Los datos de registro no son válidos.' });
  }

  const data = body as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  const birthDate = parseAdultBirthDate(data.birthDate);

  if (!name || name.length > 50) {
    return res.status(400).json({ error: 'El nombre es obligatorio y debe tener máximo 50 caracteres.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  }
  if (!birthDate) {
    return res.status(400).json({ error: 'Debes indicar una fecha válida y ser mayor de 18 años.' });
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const configuredRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const saltRounds = Number.isInteger(configuredRounds) && configuredRounds >= 10 && configuredRounds <= 15
      ? configuredRounds
      : 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await UserModel.create({ name, email, passwordHash, birthDate, role: 'client' });

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente.',
      user: publicUser(user),
      token: createAuthToken(user.id)
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    }
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ error: 'Error en el servidor al registrar el usuario.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Los datos de inicio de sesión no son válidos.' });
  }

  const data = body as Record<string, unknown>;
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Ingresa un correo y contraseña válidos.' });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      user: publicUser(user),
      token: createAuthToken(user.id)
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
  }
};

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 11000
  );
}
