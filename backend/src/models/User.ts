import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'client' | 'artist' | 'admin';
  passwordHash: string;
  birthDate?: Date;
  handle?: string;
  avatarUrl?: string;
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
  handle: { type: String, trim: true, maxlength: 30 },
  avatarUrl: { type: String, trim: true, maxlength: 500 },
  artistTitle: { type: String, trim: true, maxlength: 80 },
  bio: { type: String, trim: true, maxlength: 300 },
  responseTime: { type: String, trim: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = model<IUser>('User', userSchema);
