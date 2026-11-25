import { Schema, model, type Document } from 'mongoose';

export interface IServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  included: string;
}

export interface IServiceListing extends Document {
  slug: string;
  category: string;
  title: string;
  description: string;
  rules: string[];
  images: string[];
  packages: IServicePackage[];
  active: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const servicePackageSchema = new Schema<IServicePackage>({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  price: { type: Number, required: true, min: 0.01, max: 1000000 },
  deliveryDays: { type: Number, required: true, min: 1, max: 365 },
  included: { type: String, required: true, trim: true, maxlength: 500 }
});

const serviceListingSchema = new Schema<IServiceListing>({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 60,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  rules: {
    type: [{ type: String, trim: true, maxlength: 300 }],
    default: [],
    validate: {
      validator: (rules: string[]) => rules.length <= 20,
      message: 'Un servicio no puede tener más de 20 reglas.'
    }
  },
  images: {
    type: [{ type: String, trim: true }],
    default: [],
    validate: {
      validator: (images: string[]) => images.length <= 6,
      message: 'Un servicio no puede tener más de 6 imágenes.'
    }
  },
  packages: {
    type: [servicePackageSchema],
    required: true,
    validate: {
      validator: (packages: IServicePackage[]) => packages.length >= 1 && packages.length <= 5,
      message: 'Un servicio debe tener entre 1 y 5 paquetes.'
    }
  },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0, min: -1000, max: 10000 }
}, { timestamps: true });

serviceListingSchema.index({ active: 1, displayOrder: 1 });

export const ServiceListingModel = model<IServiceListing>('ServiceListing', serviceListingSchema);
