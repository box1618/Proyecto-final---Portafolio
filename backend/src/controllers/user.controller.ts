import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/User';
import { createAuthToken } from '../utils/auth.util';
import { isValidEmail, parseAdultBirthDate } from '../utils/authValidation';

const publicUser = (user: { id: string; name: string; email: string; role: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

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
