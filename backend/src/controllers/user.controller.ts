import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new UserModel({
      name,
      email,
      role: 'client',
      passwordHash
    });

    await newUser.save();
    return res.status(201).json({ mensaje: 'Usuario registrado exitosamente en MongoDB' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor al registrar el usuario.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
  }
};