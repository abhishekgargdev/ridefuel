import mongoose, { Schema, Model } from 'mongoose';

export interface IFuelLog {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  date: Date;
  time?: string;
  odometer: number;
  fuelQuantity: number;
  pricePerLiter: number;
  totalAmount: number;
  isFullTank: boolean;
  fuelStation?: string;
  location?: string;
  paymentMethod?: string;
  notes?: string;
  distanceSincePrevious?: number | null;
  estimatedMileage?: number | null;
  costPerKm?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const FuelLogSchema = new Schema<IFuelLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String },
    odometer: { type: Number, required: true },
    fuelQuantity: { type: Number, required: true },
    pricePerLiter: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    isFullTank: { type: Boolean, default: false },
    fuelStation: { type: String, trim: true },
    location: { type: String, trim: true },
    paymentMethod: { type: String, default: 'UPI' },
    notes: { type: String },
    distanceSincePrevious: { type: Number },
    estimatedMileage: { type: Number },
    costPerKm: { type: Number },
  },
  {
    timestamps: true,
  }
);

FuelLogSchema.index({ userId: 1, bikeId: 1, date: -1, odometer: -1 });
FuelLogSchema.index({ userId: 1, date: -1 });

export const FuelLog: Model<IFuelLog> =
  mongoose.models.FuelLog || mongoose.model<IFuelLog>('FuelLog', FuelLogSchema);
