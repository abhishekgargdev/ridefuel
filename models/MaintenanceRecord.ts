import mongoose, { Schema, Model } from 'mongoose';

export interface IMaintenanceRecord {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  serviceType: string;
  date: Date;
  odometer: number;
  amount: number;
  workshop?: string;
  description: string;
  nextDueDate?: Date;
  nextDueOdometer?: number;
  notes?: string;
  status: 'completed' | 'upcoming' | 'overdue';
  createdAt?: Date;
  updatedAt?: Date;
}

const MaintenanceRecordSchema = new Schema<IMaintenanceRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    serviceType: {
      type: String,
      required: true,
      enum: [
        'Engine oil',
        'Oil filter',
        'Air filter',
        'Chain cleaning',
        'Chain lubrication',
        'Brake inspection',
        'Brake replacement',
        'Tyres',
        'Battery',
        'General service',
        'Insurance',
        'PUC',
        'Repair',
        'Other',
      ],
      default: 'General service',
    },
    date: { type: Date, required: true },
    odometer: { type: Number, required: true },
    amount: { type: Number, required: true, default: 0 },
    workshop: { type: String, trim: true },
    description: { type: String, required: true },
    nextDueDate: { type: Date },
    nextDueOdometer: { type: Number },
    notes: { type: String },
    status: {
      type: String,
      enum: ['completed', 'upcoming', 'overdue'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

MaintenanceRecordSchema.index({ userId: 1, bikeId: 1, date: -1 });
MaintenanceRecordSchema.index({ userId: 1, status: 1 });

export const MaintenanceRecord: Model<IMaintenanceRecord> =
  mongoose.models.MaintenanceRecord ||
  mongoose.model<IMaintenanceRecord>('MaintenanceRecord', MaintenanceRecordSchema);
