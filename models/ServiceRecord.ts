import mongoose, { Schema, Model } from 'mongoose';

export interface IServiceItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface IServiceRecord {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  serviceNumber: string;
  serviceDate: Date;
  odometer: number;
  serviceCenter: string;
  serviceType: string;
  totalCost: number;
  labourCost: number;
  partsCost: number;
  otherCost: number;
  description: string;
  notes?: string;
  items: IServiceItem[];
  nextServiceDate?: Date;
  nextServiceOdometer?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>({
  itemName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 },
  notes: { type: String },
});

const ServiceRecordSchema = new Schema<IServiceRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    serviceNumber: { type: String, required: true, trim: true },
    serviceDate: { type: Date, required: true },
    odometer: { type: Number, required: true },
    serviceCenter: { type: String, required: true, trim: true },
    serviceType: { type: String, required: true, default: 'Scheduled Service' },
    totalCost: { type: Number, required: true, default: 0 },
    labourCost: { type: Number, default: 0 },
    partsCost: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },
    description: { type: String, required: true, trim: true },
    notes: { type: String },
    items: [ServiceItemSchema],
    nextServiceDate: { type: Date },
    nextServiceOdometer: { type: Number },
  },
  {
    timestamps: true,
  }
);

ServiceRecordSchema.index({ userId: 1, bikeId: 1, serviceDate: -1 });
ServiceRecordSchema.index({ userId: 1, serviceNumber: 1 });

export const ServiceRecord: Model<IServiceRecord> =
  mongoose.models.ServiceRecord ||
  mongoose.model<IServiceRecord>('ServiceRecord', ServiceRecordSchema);
