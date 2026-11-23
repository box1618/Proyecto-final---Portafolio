import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'client' | 'artist' | 'admin';
  passwordHash: string;
  birthDate?: Date;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  role: { type: String, enum: ['client', 'artist', 'admin'], default: 'client' },
  passwordHash: { type: String, required: true },
  birthDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = model<IUser>('User', userSchema);
