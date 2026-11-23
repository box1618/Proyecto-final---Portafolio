import { Schema, model, type Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true }
});

export const CategoryModel = model<ICategory>('Category', categorySchema);
