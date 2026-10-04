import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  currency: string;
  distanceUnit: 'km' | 'miles';
  fuelUnit: 'liters' | 'gallons';
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    currency: { type: String, default: '₹' },
    distanceUnit: { type: String, enum: ['km', 'miles'], default: 'km' },
    fuelUnit: { type: String, enum: ['liters', 'gallons'], default: 'liters' },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
