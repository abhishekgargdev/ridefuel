import mongoose, { Schema, Model } from 'mongoose';

export interface IDailyReading {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  date: Date;
  odometer: number;
  distance?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DailyReadingSchema = new Schema<IDailyReading>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    date: { type: Date, required: true },
    odometer: { type: Number, required: true },
    distance: { type: Number, default: 0 },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

DailyReadingSchema.index({ userId: 1, bikeId: 1, date: -1, odometer: -1 });
DailyReadingSchema.index({ userId: 1, date: -1 });

export const DailyReading: Model<IDailyReading> =
  mongoose.models.DailyReading || mongoose.model<IDailyReading>('DailyReading', DailyReadingSchema);
