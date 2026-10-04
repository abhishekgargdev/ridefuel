import mongoose, { Schema, Model } from 'mongoose';

export interface INotification {
  userId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE' | 'INFO';
  reminderType: 'DATE' | 'ODOMETER' | 'DATE_OR_ODOMETER';
  targetCategory: string;
  targetRoute: string;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['DUE_SOON', 'DUE_TODAY', 'OVERDUE', 'INFO'],
      default: 'INFO',
    },
    reminderType: {
      type: String,
      required: true,
      enum: ['DATE', 'ODOMETER', 'DATE_OR_ODOMETER'],
      default: 'DATE_OR_ODOMETER',
    },
    targetCategory: { type: String, required: true },
    targetRoute: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, bikeId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
