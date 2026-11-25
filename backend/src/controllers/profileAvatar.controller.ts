import type { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { UserModel } from '../models/User';

function uploadProfileImage(buffer: Buffer, folder: string, label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error(`Cloudinary no devolvió una URL segura para ${label}.`));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function updateProfileImage(
  req: Request,
  res: Response,
  field: 'avatarUrl' | 'bannerUrl',
  folder: string,
  label: string
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({
      error: 'La subida de imágenes requiere CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
    });
  }
  if (!req.file) {
    return res.status(400).json({ error: `Selecciona una imagen válida para ${label}.` });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  try {
    const imageUrl = await uploadProfileImage(req.file.buffer, folder, label);
    const user = await UserModel.findByIdAndUpdate(
      res.locals.userId,
      { $set: { [field]: imageUrl } },
      { returnDocument: 'after', runValidators: true }
    ).select('_id avatarUrl bannerUrl');
    if (!user) return res.status(404).json({ error: 'No se encontró la cuenta.' });
    const savedImageUrl = field === 'avatarUrl' ? user.avatarUrl : user.bannerUrl;
    return res.status(200).json({ mensaje: `Se actualizó ${label}.`, [field]: savedImageUrl });
  } catch (error) {
    console.error(`Error al subir ${label}:`, error);
    return res.status(502).json({ error: `No se pudo subir o guardar ${label}.` });
  }
}

export const updateMyAvatar = (req: Request, res: Response) =>
  updateProfileImage(req, res, 'avatarUrl', 'artfolio/avatars', 'la foto de perfil');

export const updateMyBanner = (req: Request, res: Response) =>
  updateProfileImage(req, res, 'bannerUrl', 'artfolio/banners', 'el banner');
