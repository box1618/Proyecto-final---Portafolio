import { Schema, model, Types, type Document } from 'mongoose';

export interface IArtwork extends Document {
  artistId: Types.ObjectId;
  categoryId: Types.ObjectId;
  category?: 'concept' | 'art' | 'animation';
  title: string;
  description: string;
  imageUrl: string;
  status: string;
  createdAt: Date;
}

const artworkSchema = new Schema<IArtwork>({
  artistId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  category: { type: String, enum: ['concept', 'art', 'animation'] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const ArtworkModel = model<IArtwork>('Artwork', artworkSchema);
