import mongoose, { Schema, Model } from 'mongoose';

export interface IBikeCareRecord {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  category: string;
  subCategory?: string;
  performedAt: Date;
  performedAtOdometer: number;
  description: string;
  performedBy: 'SELF' | 'SERVICE_CENTER' | 'LOCAL_MECHANIC' | 'OTHER';
  providerName?: string;
  location?: string;
  cost: number;
  paymentMethod?: string;
  duration?: string;
  notes?: string;
  receiptUrl?: string;
  nextDueDate?: Date;
  nextDueOdometer?: number;
  reminderEnabled: boolean;
  status: 'completed' | 'upcoming' | 'due' | 'overdue';
  createdAt?: Date;
  updatedAt?: Date;
}

const BikeCareRecordSchema = new Schema<IBikeCareRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, trim: true },
    performedAt: { type: Date, required: true },
    performedAtOdometer: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    performedBy: {
      type: String,
      required: true,
      enum: ['SELF', 'SERVICE_CENTER', 'LOCAL_MECHANIC', 'OTHER'],
      default: 'SELF',
    },
    providerName: { type: String, trim: true },
    location: { type: String, trim: true },
    cost: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, default: 'UPI' },
    duration: { type: String },
    notes: { type: String },
    receiptUrl: { type: String },
    nextDueDate: { type: Date },
    nextDueOdometer: { type: Number },
    reminderEnabled: { type: Boolean, default: true },
    status: {
      type: String,
      required: true,
      enum: ['completed', 'upcoming', 'due', 'overdue'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

BikeCareRecordSchema.index({ userId: 1, bikeId: 1, performedAt: -1 });
BikeCareRecordSchema.index({ userId: 1, bikeId: 1, category: 1, performedAt: -1 });
BikeCareRecordSchema.index({ userId: 1, status: 1 });

export const BikeCareRecord: Model<IBikeCareRecord> =
  mongoose.models.BikeCareRecord ||
  mongoose.model<IBikeCareRecord>('BikeCareRecord', BikeCareRecordSchema);
