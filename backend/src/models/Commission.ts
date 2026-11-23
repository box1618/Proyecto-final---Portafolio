import { Schema, model, Types, type Document } from 'mongoose';

export interface ICommission extends Document {
  clientId: Types.ObjectId;
  artistId: Types.ObjectId;
  service: 'concept' | '3d' | 'animation';
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
  service: { type: String, enum: ['concept', '3d', 'animation'], required: true },
  packageTier: { type: Number, min: 0, max: 2, required: true },
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
