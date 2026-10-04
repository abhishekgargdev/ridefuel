import mongoose, { Schema, Model } from 'mongoose';

export interface IExpense {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  date: Date;
  category: string;
  amount: number;
  odometer?: number;
  description: string;
  notes?: string;
  receiptUrl?: string;
  sourceType?: 'FUEL' | 'BIKE_CARE' | 'SERVICE' | 'REPAIR' | 'OTHER';
  sourceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    date: { type: Date, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Petrol',
        'Maintenance',
        'Repair',
        'Insurance',
        'Accessories',
        'Cleaning',
        'Parking',
        'Toll',
        'Other',
      ],
      default: 'Petrol',
    },
    amount: { type: Number, required: true },
    odometer: { type: Number },
    description: { type: String, required: true, trim: true },
    notes: { type: String },
    receiptUrl: { type: String },
    sourceType: {
      type: String,
      enum: ['FUEL', 'BIKE_CARE', 'SERVICE', 'REPAIR', 'OTHER'],
      default: 'OTHER',
    },
    sourceId: { type: String },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ userId: 1, bikeId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });
ExpenseSchema.index({ userId: 1, sourceType: 1, sourceId: 1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
