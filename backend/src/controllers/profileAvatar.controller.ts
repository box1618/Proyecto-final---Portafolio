import type { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { UserModel } from '../models/User';

function uploadAvatar(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'artfolio/avatars', resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error('Cloudinary no devolvió una URL segura para la foto.'));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export const updateMyAvatar = async (req: Request, res: Response) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({
      error: 'La subida de fotos requiere CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
    });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Selecciona una imagen válida.' });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  try {
    const avatarUrl = await uploadAvatar(req.file.buffer);
    const user = await UserModel.findByIdAndUpdate(
      res.locals.userId,
      { $set: { avatarUrl } },
      { new: true, runValidators: true }
    ).select('_id avatarUrl');
    if (!user) return res.status(404).json({ error: 'No se encontró la cuenta.' });
    return res.status(200).json({ mensaje: 'Foto de perfil actualizada.', avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error('Error al subir la foto de perfil:', error);
    return res.status(502).json({ error: 'No se pudo subir o guardar la foto de perfil.' });
  }
};
