import type { Request, Response } from 'express';
import { ArtworkModel } from '../models/Artwork';

const artworkCategories = ['concept', 'art', 'animation'];

export const listArtworks = async (req: Request, res: Response) => {
  const category = req.query.category;
  if (category !== undefined && (typeof category !== 'string' || !artworkCategories.includes(category))) {
    return res.status(400).json({ error: 'La categoría solicitada no es válida.' });
  }

  const filters: Record<string, unknown> = {
    imageUrl: { $regex: /^https:\/\/res\.cloudinary\.com\// },
    status: { $ne: 'draft' }
  };
  if (typeof category === 'string') {
    filters.$or = [
      { category },
      { category: { $exists: false } }
    ];
  }

  try {
    const artworks = await ArtworkModel.find(filters)
      .sort({ createdAt: -1 })
      .select('title description category imageUrl createdAt')
      .lean();
    return res.status(200).json({ artworks });
  } catch (error) {
    console.error('Error al consultar artworks:', error);
    return res.status(500).json({ error: 'No se pudieron cargar las imágenes del portafolio.' });
  }
};
