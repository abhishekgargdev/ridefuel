import mongoose, { Schema, Model } from 'mongoose';

export interface IBike {
  userId: mongoose.Types.ObjectId;
  name: string;
  manufacturer: string;
  model: string;
  variant?: string;
  year: number;
  registrationNumber?: string;
  purchaseDate?: Date;
  initialOdometer: number;
  currentOdometer: number;
  tankCapacity: number;
  reserveCapacity?: number;
  expectedMileage: number;
  isActive: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BikeSchema = new Schema<IBike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    variant: { type: String },
    year: { type: Number, required: true },
    registrationNumber: { type: String, trim: true },
    purchaseDate: { type: Date },
    initialOdometer: { type: Number, required: true, default: 0 },
    currentOdometer: { type: Number, required: true, default: 0 },
    tankCapacity: { type: Number, required: true },
    reserveCapacity: { type: Number },
    expectedMileage: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

BikeSchema.index({ userId: 1, isActive: 1 });
BikeSchema.index({ userId: 1, createdAt: -1 });

export const Bike: Model<IBike> =
  mongoose.models.Bike || mongoose.model<IBike>('Bike', BikeSchema);
