import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'client' | 'artist' | 'admin';
  passwordHash: string;
  birthDate?: Date;
  handle?: string;
  artistTitle?: string;
  bio?: string;
  responseTime?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  role: { type: String, enum: ['client', 'artist', 'admin'], default: 'client' },
  passwordHash: { type: String, required: true },
  birthDate: { type: Date },
  handle: { type: String, trim: true, maxlength: 30, default: 'artfoliostudio' },
  artistTitle: { type: String, trim: true, maxlength: 80, default: 'Artista digital / concept artist' },
  bio: { type: String, trim: true, maxlength: 300, default: 'Diseño mundos, personajes y escenas para historias que merecen ser recordadas.' },
  responseTime: { type: String, trim: true, maxlength: 100, default: 'Respondo mensajes en 1-2 días hábiles' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = model<IUser>('User', userSchema);
