import mongoose, { Schema, Model } from 'mongoose';

export interface IBikeCareRule {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  category: string;
  defaultIntervalKm?: number;
  defaultIntervalDays?: number;
  intervalMode: 'KM' | 'DAYS' | 'KM_OR_DAYS' | 'KM_AND_DAYS';
  enabled: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BikeCareRuleSchema = new Schema<IBikeCareRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    category: { type: String, required: true, trim: true },
    defaultIntervalKm: { type: Number },
    defaultIntervalDays: { type: Number },
    intervalMode: {
      type: String,
      required: true,
      enum: ['KM', 'DAYS', 'KM_OR_DAYS', 'KM_AND_DAYS'],
      default: 'KM_OR_DAYS',
    },
    enabled: { type: Boolean, default: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

BikeCareRuleSchema.index({ userId: 1, bikeId: 1, category: 1 }, { unique: true });

export const BikeCareRule: Model<IBikeCareRule> =
  mongoose.models.BikeCareRule ||
  mongoose.model<IBikeCareRule>('BikeCareRule', BikeCareRuleSchema);
