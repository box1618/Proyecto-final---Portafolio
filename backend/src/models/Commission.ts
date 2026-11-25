import { Schema, model, Types, type Document } from 'mongoose';

export interface ICommission extends Document {
  clientId: Types.ObjectId;
  artistId: Types.ObjectId;
  catalogListingId?: Types.ObjectId;
  service: string;
  serviceName?: string;
  serviceDescription?: string;
  serviceRules?: string[];
  serviceImages?: string[];
  packageName?: string;
  packageDescription?: string;
  packageIncluded?: string;
  packageDeliveryDays?: number;
  packageTier: number;
  licenses: ('commercial' | 'merchandising')[];
  title: string;
  description: string;
  budget: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
}

const commissionSchema = new Schema<ICommission>({
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  artistId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  catalogListingId: { type: Schema.Types.ObjectId, ref: 'ServiceListing' },
  service: { type: String, required: true, trim: true, maxlength: 60 },
  serviceName: { type: String, trim: true, maxlength: 120 },
  serviceDescription: { type: String, trim: true, maxlength: 2000 },
  serviceRules: { type: [String], default: [] },
  serviceImages: { type: [String], default: [] },
  packageName: { type: String, trim: true, maxlength: 50 },
  packageDescription: { type: String, trim: true, maxlength: 500 },
  packageIncluded: { type: String, trim: true, maxlength: 500 },
  packageDeliveryDays: { type: Number, min: 1, max: 365 },
  packageTier: { type: Number, min: 0, max: 4, required: true },
  licenses: { type: [String], enum: ['commercial', 'merchandising'], default: [] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export const CommissionModel = model<ICommission>('Commission', commissionSchema);
