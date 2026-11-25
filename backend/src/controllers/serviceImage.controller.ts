import type { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

function uploadImage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'artfolio/services', resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error('Cloudinary no devolvió una URL segura para la imagen.'));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export const uploadServiceImages = async (req: Request, res: Response) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({
      error: 'La subida de imágenes requiere CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
    });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos una imagen.' });
  }

  try {
    const images = await Promise.all(files.map((file) => uploadImage(file.buffer)));
    return res.status(201).json({ images });
  } catch (error) {
    console.error('Error al subir imágenes de servicio a Cloudinary:', error);
    return res.status(502).json({ error: 'No se pudieron subir las imágenes a Cloudinary.' });
  }
};
