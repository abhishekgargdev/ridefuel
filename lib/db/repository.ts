import { connectToDatabase, isDatabaseConnected } from './mongodb';
import { User, IUser } from '@/models/User';
import { Bike, IBike } from '@/models/Bike';
import { FuelLog, IFuelLog } from '@/models/FuelLog';
import { DailyReading, IDailyReading } from '@/models/DailyReading';
import { Expense, IExpense } from '@/models/Expense';
import { MaintenanceRecord, IMaintenanceRecord } from '@/models/MaintenanceRecord';
import { BikeCareRecord, IBikeCareRecord } from '@/models/BikeCareRecord';
import { BikeCareRule, IBikeCareRule } from '@/models/BikeCareRule';
import { ServiceRecord, IServiceRecord } from '@/models/ServiceRecord';
import { Notification, INotification } from '@/models/Notification';
import { getInitialSeedData, DEMO_USER_ID } from './seed-data';
import type {
  User as UserType,
  Bike as BikeType,
  FuelLog as FuelLogType,
  DailyReading as DailyReadingType,
  Expense as ExpenseType,
  MaintenanceRecord as MaintenanceRecordType,
  BikeCareRecord as BikeCareRecordType,
  BikeCareRule as BikeCareRuleType,
  ServiceRecord as ServiceRecordType,
  NotificationItem as NotificationItemType,
} from '@/types';

// In-memory persistent cache for fallback store (scoped to process global)
interface MemoryDatabase {
  users: (UserType & { passwordHash: string; resetToken?: string; resetTokenExpiry?: Date })[];
  bikes: BikeType[];
  fuelLogs: FuelLogType[];
  dailyReadings: DailyReadingType[];
  expenses: ExpenseType[];
  maintenanceRecords: MaintenanceRecordType[];
  bikeCareRules: BikeCareRuleType[];
  bikeCareRecords: BikeCareRecordType[];
  serviceRecords: ServiceRecordType[];
  notifications: NotificationItemType[];
  initialized: boolean;
}

declare global {
  var memoryDb: MemoryDatabase | undefined;
}

function getMemoryDb(): MemoryDatabase {
  if (!global.memoryDb || !global.memoryDb.initialized) {
    const seed = getInitialSeedData();
    global.memoryDb = {
      users: seed.users,
      bikes: seed.bikes,
      fuelLogs: seed.fuelLogs,
      dailyReadings: seed.dailyReadings,
      expenses: seed.expenses,
      maintenanceRecords: seed.maintenanceRecords,
      bikeCareRules: seed.bikeCareRules,
      bikeCareRecords: seed.bikeCareRecords,
      serviceRecords: seed.serviceRecords,
      notifications: seed.notifications,
      initialized: true,
    };
  }
  return global.memoryDb;
}

function generateId(): string {
  return '65432' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36).substring(2, 6);
}

export class Repository {
  // ================= USER OPERATIONS =================
  static async findUserByEmail(email: string) {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const u = await User.findOne({ email: email.toLowerCase().trim() }).lean();
        if (u) {
          return {
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            passwordHash: u.passwordHash,
            currency: u.currency || '₹',
            distanceUnit: u.distanceUnit || 'km',
            fuelUnit: u.fuelUnit || 'liters',
            resetToken: u.resetToken,
            resetTokenExpiry: u.resetTokenExpiry,
            createdAt: u.createdAt?.toISOString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB query failed, falling back to memory store:', e);
      }
    }

    const db = getMemoryDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    return user || null;
  }

  static async findUserById(id: string) {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const u = await User.findById(id).lean();
        if (u) {
          return {
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            passwordHash: u.passwordHash,
            currency: u.currency || '₹',
            distanceUnit: u.distanceUnit || 'km',
            fuelUnit: u.fuelUnit || 'liters',
            resetToken: u.resetToken,
            resetTokenExpiry: u.resetTokenExpiry,
            createdAt: u.createdAt?.toISOString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB query failed, falling back to memory store:', e);
      }
    }

    const db = getMemoryDb();
    const user = db.users.find((u) => u.id === id || u._id === id);
    return user || null;
  }

  static async createUser(data: { name: string; email: string; passwordHash: string }) {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await User.create({
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash,
          currency: '₹',
          distanceUnit: 'km',
          fuelUnit: 'liters',
        });
        return {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          currency: doc.currency,
          distanceUnit: doc.distanceUnit,
          fuelUnit: doc.fuelUnit,
        };
      } catch (e) {
        console.warn('MongoDB create user failed, falling back to memory store:', e);
      }
    }

    const db = getMemoryDb();
    const newUser = {
      id: generateId(),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      currency: '₹',
      distanceUnit: 'km' as const,
      fuelUnit: 'liters' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      currency: newUser.currency,
      distanceUnit: newUser.distanceUnit,
      fuelUnit: newUser.fuelUnit,
    };
  }

  static async updateUser(
    id: string,
    data: Partial<{
      name: string;
      currency: string;
      distanceUnit: 'km' | 'miles';
      fuelUnit: 'liters' | 'gallons';
      passwordHash?: string;
    }>
  ) {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await User.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
        if (doc) {
          return {
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            currency: doc.currency,
            distanceUnit: doc.distanceUnit,
            fuelUnit: doc.fuelUnit,
          };
        }
      } catch (e) {
        console.warn('MongoDB update user failed:', e);
      }
    }

    const db = getMemoryDb();
    const index = db.users.findIndex((u) => u.id === id || u._id === id);
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...data, updatedAt: new Date().toISOString() };
      return db.users[index];
    }
    return null;
  }

  static async setUserResetToken(email: string, token: string, expiry: Date) {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        await User.updateOne(
          { email: email.toLowerCase().trim() },
          { $set: { resetToken: token, resetTokenExpiry: expiry } }
        );
        return true;
      } catch (e) {
        console.warn('MongoDB set reset token failed:', e);
      }
    }

    const db = getMemoryDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (user) {
      user.resetToken = token;
      user.resetTokenExpiry = expiry;
      return true;
    }
    return false;
  }

  static async resetPasswordWithToken(token: string, newPasswordHash: string) {
    await connectToDatabase();
    const now = new Date();
    if (isDatabaseConnected()) {
      try {
        const user = await User.findOne({
          resetToken: token,
          resetTokenExpiry: { $gt: now },
        });
        if (user) {
          user.passwordHash = newPasswordHash;
          user.resetToken = undefined;
          user.resetTokenExpiry = undefined;
          await user.save();
          return true;
        }
      } catch (e) {
        console.warn('MongoDB reset password failed:', e);
      }
    }

    const db = getMemoryDb();
    const user = db.users.find(
      (u) =>
        u.resetToken === token &&
        u.resetTokenExpiry &&
        new Date(u.resetTokenExpiry) > now
    );
    if (user) {
      user.passwordHash = newPasswordHash;
      delete user.resetToken;
      delete user.resetTokenExpiry;
      return true;
    }
    return false;
  }

  // ================= BIKE OPERATIONS =================
  static async getBikesByUser(userId: string): Promise<BikeType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const docs = await Bike.find({ userId }).sort({ isActive: -1, createdAt: -1 }).lean();
        return docs.map((b) => ({
          id: b._id.toString(),
          userId: b.userId.toString(),
          name: b.name,
          manufacturer: b.manufacturer,
          model: b.model,
          variant: b.variant,
          year: b.year,
          registrationNumber: b.registrationNumber,
          purchaseDate: b.purchaseDate ? b.purchaseDate.toISOString().split('T')[0] : undefined,
          initialOdometer: b.initialOdometer,
          currentOdometer: b.currentOdometer,
          tankCapacity: b.tankCapacity,
          reserveCapacity: b.reserveCapacity,
          expectedMileage: b.expectedMileage,
          isActive: b.isActive,
          notes: b.notes,
          createdAt: b.createdAt?.toISOString(),
          updatedAt: b.updatedAt?.toISOString(),
        }));
      } catch (e) {
        console.warn('MongoDB getBikes failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.bikes.filter((b) => b.userId === userId);
  }

  static async getActiveBikeByUser(userId: string): Promise<BikeType | null> {
    const bikes = await this.getBikesByUser(userId);
    return bikes.find((b) => b.isActive) || bikes[0] || null;
  }

  static async getBikeById(id: string, userId: string): Promise<BikeType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const b = await Bike.findOne({ _id: id, userId }).lean();
        if (b) {
          return {
            id: b._id.toString(),
            userId: b.userId.toString(),
            name: b.name,
            manufacturer: b.manufacturer,
            model: b.model,
            variant: b.variant,
            year: b.year,
            registrationNumber: b.registrationNumber,
            purchaseDate: b.purchaseDate ? b.purchaseDate.toISOString().split('T')[0] : undefined,
            initialOdometer: b.initialOdometer,
            currentOdometer: b.currentOdometer,
            tankCapacity: b.tankCapacity,
            reserveCapacity: b.reserveCapacity,
            expectedMileage: b.expectedMileage,
            isActive: b.isActive,
            notes: b.notes,
            createdAt: b.createdAt?.toISOString(),
            updatedAt: b.updatedAt?.toISOString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB getBikeById failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.bikes.find((b) => (b.id === id || b._id === id) && b.userId === userId) || null;
  }

  static async findBikeById(id: string, userId: string): Promise<BikeType | null> {
    return this.getBikeById(id, userId);
  }

  static async createBike(userId: string, data: Partial<BikeType>): Promise<BikeType> {
    await connectToDatabase();
    const bikes = await this.getBikesByUser(userId);
    const isFirst = bikes.length === 0;

    if (isDatabaseConnected()) {
      try {
        if (data.isActive || isFirst) {
          await Bike.updateMany({ userId }, { $set: { isActive: false } });
        }
        const doc = await Bike.create({
          userId,
          name: data.name,
          manufacturer: data.manufacturer || 'Royal Enfield',
          model: data.model || 'Classic 350',
          variant: data.variant,
          year: data.year || 2022,
          registrationNumber: data.registrationNumber,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
          initialOdometer: data.initialOdometer || 0,
          currentOdometer: data.currentOdometer || data.initialOdometer || 0,
          tankCapacity: data.tankCapacity || 13,
          reserveCapacity: data.reserveCapacity || 2.6,
          expectedMileage: data.expectedMileage || 35,
          isActive: data.isActive !== undefined ? data.isActive : isFirst,
          notes: data.notes,
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          name: doc.name,
          manufacturer: doc.manufacturer,
          model: doc.model,
          variant: doc.variant,
          year: doc.year,
          registrationNumber: doc.registrationNumber,
          purchaseDate: doc.purchaseDate?.toISOString().split('T')[0],
          initialOdometer: doc.initialOdometer,
          currentOdometer: doc.currentOdometer,
          tankCapacity: doc.tankCapacity,
          reserveCapacity: doc.reserveCapacity,
          expectedMileage: doc.expectedMileage,
          isActive: doc.isActive,
          notes: doc.notes,
        };
      } catch (e) {
        console.warn('MongoDB create bike failed:', e);
      }
    }

    const db = getMemoryDb();
    if (data.isActive || isFirst) {
      db.bikes.forEach((b) => {
        if (b.userId === userId) b.isActive = false;
      });
    }

    const newBike: BikeType = {
      id: generateId(),
      userId,
      name: data.name || 'My Motorcycle',
      manufacturer: data.manufacturer || 'Royal Enfield',
      model: data.model || 'Classic 350',
      variant: data.variant,
      year: data.year || 2022,
      registrationNumber: data.registrationNumber,
      purchaseDate: data.purchaseDate,
      initialOdometer: data.initialOdometer || 0,
      currentOdometer: data.currentOdometer || data.initialOdometer || 0,
      tankCapacity: data.tankCapacity || 13,
      reserveCapacity: data.reserveCapacity || 2.6,
      expectedMileage: data.expectedMileage || 35,
      isActive: data.isActive !== undefined ? data.isActive : isFirst,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.bikes.push(newBike);
    return newBike;
  }

  static async updateBike(id: string, userId: string, data: Partial<BikeType>): Promise<BikeType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        if (data.isActive) {
          await Bike.updateMany({ userId, _id: { $ne: id } }, { $set: { isActive: false } });
        }
        const doc = await Bike.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true }).lean();
        if (doc) {
          return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            name: doc.name,
            manufacturer: doc.manufacturer,
            model: doc.model,
            variant: doc.variant,
            year: doc.year,
            registrationNumber: doc.registrationNumber,
            purchaseDate: doc.purchaseDate?.toISOString().split('T')[0],
            initialOdometer: doc.initialOdometer,
            currentOdometer: doc.currentOdometer,
            tankCapacity: doc.tankCapacity,
            reserveCapacity: doc.reserveCapacity,
            expectedMileage: doc.expectedMileage,
            isActive: doc.isActive,
            notes: doc.notes,
          };
        }
      } catch (e) {
        console.warn('MongoDB update bike failed:', e);
      }
    }

    const db = getMemoryDb();
    const idx = db.bikes.findIndex((b) => (b.id === id || b._id === id) && b.userId === userId);
    if (idx !== -1) {
      if (data.isActive) {
        db.bikes.forEach((b) => {
          if (b.userId === userId) b.isActive = false;
        });
      }
      db.bikes[idx] = { ...db.bikes[idx], ...data, updatedAt: new Date().toISOString() };
      return db.bikes[idx];
    }
    return null;
  }

  static async deleteBike(id: string, userId: string): Promise<boolean> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const res = await Bike.deleteOne({ _id: id, userId });
        if (res.deletedCount > 0) {
          await Promise.all([
            FuelLog.deleteMany({ bikeId: id, userId }),
            DailyReading.deleteMany({ bikeId: id, userId }),
            Expense.deleteMany({ bikeId: id, userId }),
            MaintenanceRecord.deleteMany({ bikeId: id, userId }),
          ]);
          return true;
        }
      } catch (e) {
        console.warn('MongoDB delete bike failed:', e);
      }
    }

    const db = getMemoryDb();
    const initialLen = db.bikes.length;
    db.bikes = db.bikes.filter((b) => !((b.id === id || b._id === id) && b.userId === userId));
    if (db.bikes.length < initialLen) {
      db.fuelLogs = db.fuelLogs.filter((f) => !(f.bikeId === id && f.userId === userId));
      db.dailyReadings = db.dailyReadings.filter((r) => !(r.bikeId === id && r.userId === userId));
      db.expenses = db.expenses.filter((e) => !(e.bikeId === id && e.userId === userId));
      db.maintenanceRecords = db.maintenanceRecords.filter((m) => !(m.bikeId === id && m.userId === userId));
      return true;
    }
    return false;
  }

  static async setActiveBike(id: string, userId: string): Promise<BikeType | null> {
    return this.updateBike(id, userId, { isActive: true });
  }

  // ================= FUEL LOG OPERATIONS =================
  static async getFuelLogs(userId: string, bikeId?: string): Promise<FuelLogType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        const docs = await FuelLog.find(query).sort({ date: -1, odometer: -1 }).lean();
        return docs.map((f) => ({
          id: f._id.toString(),
          userId: f.userId.toString(),
          bikeId: f.bikeId.toString(),
          date: f.date.toISOString().split('T')[0],
          time: f.time,
          odometer: f.odometer,
          fuelQuantity: f.fuelQuantity,
          pricePerLiter: f.pricePerLiter,
          totalAmount: f.totalAmount,
          isFullTank: f.isFullTank,
          fuelStation: f.fuelStation,
          location: f.location,
          paymentMethod: f.paymentMethod,
          notes: f.notes,
          distanceSincePrevious: f.distanceSincePrevious,
          estimatedMileage: f.estimatedMileage,
          costPerKm: f.costPerKm,
          createdAt: f.createdAt?.toISOString(),
          updatedAt: f.updatedAt?.toISOString(),
        }));
      } catch (e) {
        console.warn('MongoDB getFuelLogs failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.fuelLogs
      .filter((f) => f.userId === userId && (!bikeId || f.bikeId === bikeId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometer - a.odometer);
  }

  static async getFuelLogById(id: string, userId: string): Promise<FuelLogType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const f = await FuelLog.findOne({ _id: id, userId }).lean();
        if (f) {
          return {
            id: f._id.toString(),
            userId: f.userId.toString(),
            bikeId: f.bikeId.toString(),
            date: f.date.toISOString().split('T')[0],
            time: f.time,
            odometer: f.odometer,
            fuelQuantity: f.fuelQuantity,
            pricePerLiter: f.pricePerLiter,
            totalAmount: f.totalAmount,
            isFullTank: f.isFullTank,
            fuelStation: f.fuelStation,
            location: f.location,
            paymentMethod: f.paymentMethod,
            notes: f.notes,
            distanceSincePrevious: f.distanceSincePrevious,
            estimatedMileage: f.estimatedMileage,
            costPerKm: f.costPerKm,
            createdAt: f.createdAt?.toISOString(),
            updatedAt: f.updatedAt?.toISOString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB getFuelLogById failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.fuelLogs.find((f) => (f.id === id || f._id === id) && f.userId === userId) || null;
  }

  static async createFuelLog(userId: string, data: Partial<FuelLogType>): Promise<FuelLogType> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await FuelLog.create({
          userId,
          bikeId: data.bikeId,
          date: new Date(data.date || Date.now()),
          time: data.time,
          odometer: data.odometer,
          fuelQuantity: data.fuelQuantity,
          pricePerLiter: data.pricePerLiter,
          totalAmount: data.totalAmount,
          isFullTank: data.isFullTank || false,
          fuelStation: data.fuelStation,
          location: data.location,
          paymentMethod: data.paymentMethod || 'UPI',
          notes: data.notes,
          distanceSincePrevious: data.distanceSincePrevious,
          estimatedMileage: data.estimatedMileage,
          costPerKm: data.costPerKm,
        });

        // Update bike's current odometer if new log has higher reading
        if (data.bikeId && data.odometer) {
          const currentBike = await Bike.findOne({ _id: data.bikeId, userId });
          if (currentBike && data.odometer > currentBike.currentOdometer) {
            currentBike.currentOdometer = data.odometer;
            await currentBike.save();
          }
        }

        return {
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          bikeId: doc.bikeId.toString(),
          date: doc.date.toISOString().split('T')[0],
          time: doc.time,
          odometer: doc.odometer,
          fuelQuantity: doc.fuelQuantity,
          pricePerLiter: doc.pricePerLiter,
          totalAmount: doc.totalAmount,
          isFullTank: doc.isFullTank,
          fuelStation: doc.fuelStation,
          location: doc.location,
          paymentMethod: doc.paymentMethod,
          notes: doc.notes,
          distanceSincePrevious: doc.distanceSincePrevious,
          estimatedMileage: doc.estimatedMileage,
          costPerKm: doc.costPerKm,
        };
      } catch (e) {
        console.warn('MongoDB create fuel log failed:', e);
      }
    }

    const db = getMemoryDb();
    const newLog: FuelLogType = {
      id: generateId(),
      userId,
      bikeId: data.bikeId || '',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '12:00',
      odometer: data.odometer || 0,
      fuelQuantity: data.fuelQuantity || 0,
      pricePerLiter: data.pricePerLiter || 0,
      totalAmount: data.totalAmount || 0,
      isFullTank: !!data.isFullTank,
      fuelStation: data.fuelStation,
      location: data.location,
      paymentMethod: data.paymentMethod || 'UPI',
      notes: data.notes,
      distanceSincePrevious: data.distanceSincePrevious,
      estimatedMileage: data.estimatedMileage,
      costPerKm: data.costPerKm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.fuelLogs.unshift(newLog);

    // Update bike's current odometer
    if (data.bikeId && data.odometer) {
      const bike = db.bikes.find((b) => (b.id === data.bikeId || b._id === data.bikeId) && b.userId === userId);
      if (bike && data.odometer > bike.currentOdometer) {
        bike.currentOdometer = data.odometer;
      }
    }

    return newLog;
  }

  static async updateFuelLog(id: string, userId: string, data: Partial<FuelLogType>): Promise<FuelLogType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const updateData: Record<string, unknown> = { ...data };
        if (data.date) updateData.date = new Date(data.date);
        const doc = await FuelLog.findOneAndUpdate({ _id: id, userId }, { $set: updateData }, { new: true }).lean();
        if (doc) {
          return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bikeId: doc.bikeId.toString(),
            date: doc.date.toISOString().split('T')[0],
            time: doc.time,
            odometer: doc.odometer,
            fuelQuantity: doc.fuelQuantity,
            pricePerLiter: doc.pricePerLiter,
            totalAmount: doc.totalAmount,
            isFullTank: doc.isFullTank,
            fuelStation: doc.fuelStation,
            location: doc.location,
            paymentMethod: doc.paymentMethod,
            notes: doc.notes,
            distanceSincePrevious: doc.distanceSincePrevious,
            estimatedMileage: doc.estimatedMileage,
            costPerKm: doc.costPerKm,
          };
        }
      } catch (e) {
        console.warn('MongoDB update fuel log failed:', e);
      }
    }

    const db = getMemoryDb();
    const idx = db.fuelLogs.findIndex((f) => (f.id === id || f._id === id) && f.userId === userId);
    if (idx !== -1) {
      db.fuelLogs[idx] = { ...db.fuelLogs[idx], ...data, updatedAt: new Date().toISOString() };
      return db.fuelLogs[idx];
    }
    return null;
  }

  static async deleteFuelLog(id: string, userId: string): Promise<boolean> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const res = await FuelLog.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (e) {
        console.warn('MongoDB delete fuel log failed:', e);
      }
    }

    const db = getMemoryDb();
    const initLen = db.fuelLogs.length;
    db.fuelLogs = db.fuelLogs.filter((f) => !((f.id === id || f._id === id) && f.userId === userId));
    return db.fuelLogs.length < initLen;
  }

  // ================= DAILY READING OPERATIONS =================
  static async getDailyReadings(userId: string, bikeId?: string): Promise<DailyReadingType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        const docs = await DailyReading.find(query).sort({ date: -1, odometer: -1 }).lean();
        return docs.map((r) => ({
          id: r._id.toString(),
          userId: r.userId.toString(),
          bikeId: r.bikeId.toString(),
          date: r.date.toISOString().split('T')[0],
          odometer: r.odometer,
          distance: r.distance,
          notes: r.notes,
          createdAt: r.createdAt?.toISOString(),
          updatedAt: r.updatedAt?.toISOString(),
        }));
      } catch (e) {
        console.warn('MongoDB getDailyReadings failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.dailyReadings
      .filter((r) => r.userId === userId && (!bikeId || r.bikeId === bikeId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometer - a.odometer);
  }

  static async getDailyReadingById(id: string, userId: string): Promise<DailyReadingType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const r = await DailyReading.findOne({ _id: id, userId }).lean();
        if (r) {
          return {
            id: r._id.toString(),
            userId: r.userId.toString(),
            bikeId: r.bikeId.toString(),
            date: r.date.toISOString().split('T')[0],
            odometer: r.odometer,
            distance: r.distance,
            notes: r.notes,
            createdAt: r.createdAt?.toISOString(),
            updatedAt: r.updatedAt?.toISOString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB getDailyReadingById failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.dailyReadings.find((r) => (r.id === id || r._id === id) && r.userId === userId) || null;
  }

  static async createDailyReading(userId: string, data: Partial<DailyReadingType>): Promise<DailyReadingType> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await DailyReading.create({
          userId,
          bikeId: data.bikeId,
          date: new Date(data.date || Date.now()),
          odometer: data.odometer,
          distance: data.distance || 0,
          notes: data.notes,
        });

        // Update bike odometer
        if (data.bikeId && data.odometer) {
          const bike = await Bike.findOne({ _id: data.bikeId, userId });
          if (bike && data.odometer > bike.currentOdometer) {
            bike.currentOdometer = data.odometer;
            await bike.save();
          }
        }

        return {
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          bikeId: doc.bikeId.toString(),
          date: doc.date.toISOString().split('T')[0],
          odometer: doc.odometer,
          distance: doc.distance,
          notes: doc.notes,
        };
      } catch (e) {
        console.warn('MongoDB create daily reading failed:', e);
      }
    }

    const db = getMemoryDb();
    const newReading: DailyReadingType = {
      id: generateId(),
      userId,
      bikeId: data.bikeId || '',
      date: data.date || new Date().toISOString().split('T')[0],
      odometer: data.odometer || 0,
      distance: data.distance || 0,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.dailyReadings.unshift(newReading);

    if (data.bikeId && data.odometer) {
      const bike = db.bikes.find((b) => (b.id === data.bikeId || b._id === data.bikeId) && b.userId === userId);
      if (bike && data.odometer > bike.currentOdometer) {
        bike.currentOdometer = data.odometer;
      }
    }

    return newReading;
  }

  static async updateDailyReading(id: string, userId: string, data: Partial<DailyReadingType>): Promise<DailyReadingType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const updateData: Record<string, unknown> = { ...data };
        if (data.date) updateData.date = new Date(data.date);
        const doc = await DailyReading.findOneAndUpdate({ _id: id, userId }, { $set: updateData }, { new: true }).lean();
        if (doc) {
          return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bikeId: doc.bikeId.toString(),
            date: doc.date.toISOString().split('T')[0],
            odometer: doc.odometer,
            distance: doc.distance,
            notes: doc.notes,
          };
        }
      } catch (e) {
        console.warn('MongoDB update reading failed:', e);
      }
    }

    const db = getMemoryDb();
    const idx = db.dailyReadings.findIndex((r) => (r.id === id || r._id === id) && r.userId === userId);
    if (idx !== -1) {
      db.dailyReadings[idx] = { ...db.dailyReadings[idx], ...data, updatedAt: new Date().toISOString() };
      return db.dailyReadings[idx];
    }
    return null;
  }

  static async deleteDailyReading(id: string, userId: string): Promise<boolean> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const res = await DailyReading.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (e) {
        console.warn('MongoDB delete reading failed:', e);
      }
    }

    const db = getMemoryDb();
    const initLen = db.dailyReadings.length;
    db.dailyReadings = db.dailyReadings.filter((r) => !((r.id === id || r._id === id) && r.userId === userId));
    return db.dailyReadings.length < initLen;
  }

  // ================= EXPENSE OPERATIONS =================
  static async getExpenses(userId: string, bikeId?: string): Promise<ExpenseType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        const docs = await Expense.find(query).sort({ date: -1 }).lean();
        return docs.map((e) => ({
          id: e._id.toString(),
          userId: e.userId.toString(),
          bikeId: e.bikeId.toString(),
          date: e.date.toISOString().split('T')[0],
          category: e.category as ExpenseType['category'],
          amount: e.amount,
          odometer: e.odometer,
          description: e.description,
          notes: e.notes,
          receiptUrl: e.receiptUrl,
          createdAt: e.createdAt?.toISOString(),
          updatedAt: e.updatedAt?.toISOString(),
        }));
      } catch (e) {
        console.warn('MongoDB getExpenses failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.expenses
      .filter((e) => e.userId === userId && (!bikeId || e.bikeId === bikeId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async getExpenseById(id: string, userId: string): Promise<ExpenseType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const e = await Expense.findOne({ _id: id, userId }).lean();
        if (e) {
          return {
            id: e._id.toString(),
            userId: e.userId.toString(),
            bikeId: e.bikeId.toString(),
            date: e.date.toISOString().split('T')[0],
            category: e.category as ExpenseType['category'],
            amount: e.amount,
            odometer: e.odometer,
            description: e.description,
            notes: e.notes,
            receiptUrl: e.receiptUrl,
            createdAt: e.createdAt?.toISOString(),
            updatedAt: e.updatedAt?.toISOString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB getExpenseById failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.expenses.find((e) => (e.id === id || e._id === id) && e.userId === userId) || null;
  }

  static async createExpense(userId: string, data: Partial<ExpenseType>): Promise<ExpenseType> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await Expense.create({
          userId,
          bikeId: data.bikeId,
          date: new Date(data.date || Date.now()),
          category: data.category || 'Other',
          amount: data.amount,
          odometer: data.odometer,
          description: data.description,
          notes: data.notes,
          receiptUrl: data.receiptUrl,
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          bikeId: doc.bikeId.toString(),
          date: doc.date.toISOString().split('T')[0],
          category: doc.category as ExpenseType['category'],
          amount: doc.amount,
          odometer: doc.odometer,
          description: doc.description,
          notes: doc.notes,
          receiptUrl: doc.receiptUrl,
        };
      } catch (e) {
        console.warn('MongoDB create expense failed:', e);
      }
    }

    const db = getMemoryDb();
    const newExpense: ExpenseType = {
      id: generateId(),
      userId,
      bikeId: data.bikeId || '',
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'Other',
      amount: data.amount || 0,
      odometer: data.odometer,
      description: data.description || '',
      notes: data.notes,
      receiptUrl: data.receiptUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.expenses.unshift(newExpense);
    return newExpense;
  }

  static async updateExpense(id: string, userId: string, data: Partial<ExpenseType>): Promise<ExpenseType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const updateData: Record<string, unknown> = { ...data };
        if (data.date) updateData.date = new Date(data.date);
        const doc = await Expense.findOneAndUpdate({ _id: id, userId }, { $set: updateData }, { new: true }).lean();
        if (doc) {
          return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bikeId: doc.bikeId.toString(),
            date: doc.date.toISOString().split('T')[0],
            category: doc.category as ExpenseType['category'],
            amount: doc.amount,
            odometer: doc.odometer,
            description: doc.description,
            notes: doc.notes,
            receiptUrl: doc.receiptUrl,
          };
        }
      } catch (e) {
        console.warn('MongoDB update expense failed:', e);
      }
    }

    const db = getMemoryDb();
    const idx = db.expenses.findIndex((e) => (e.id === id || e._id === id) && e.userId === userId);
    if (idx !== -1) {
      db.expenses[idx] = { ...db.expenses[idx], ...data, updatedAt: new Date().toISOString() };
      return db.expenses[idx];
    }
    return null;
  }

  static async deleteExpense(id: string, userId: string): Promise<boolean> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const res = await Expense.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (e) {
        console.warn('MongoDB delete expense failed:', e);
      }
    }

    const db = getMemoryDb();
    const initLen = db.expenses.length;
    db.expenses = db.expenses.filter((e) => !((e.id === id || e._id === id) && e.userId === userId));
    return db.expenses.length < initLen;
  }

  // ================= MAINTENANCE RECORD OPERATIONS =================
  static async getMaintenanceRecords(userId: string, bikeId?: string): Promise<MaintenanceRecordType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        const docs = await MaintenanceRecord.find(query).sort({ date: -1 }).lean();
        return docs.map((m) => ({
          id: m._id.toString(),
          userId: m.userId.toString(),
          bikeId: m.bikeId.toString(),
          serviceType: m.serviceType as MaintenanceRecordType['serviceType'],
          date: m.date.toISOString().split('T')[0],
          odometer: m.odometer,
          amount: m.amount,
          workshop: m.workshop,
          description: m.description,
          nextDueDate: m.nextDueDate ? m.nextDueDate.toISOString().split('T')[0] : undefined,
          nextDueOdometer: m.nextDueOdometer,
          notes: m.notes,
          status: m.status,
          createdAt: m.createdAt?.toISOString(),
          updatedAt: m.updatedAt?.toISOString(),
        }));
      } catch (e) {
        console.warn('MongoDB getMaintenanceRecords failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.maintenanceRecords
      .filter((m) => m.userId === userId && (!bikeId || m.bikeId === bikeId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async getMaintenanceRecordById(id: string, userId: string): Promise<MaintenanceRecordType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const m = await MaintenanceRecord.findOne({ _id: id, userId }).lean();
        if (m) {
          return {
            id: m._id.toString(),
            userId: m.userId.toString(),
            bikeId: m.bikeId.toString(),
            serviceType: m.serviceType as MaintenanceRecordType['serviceType'],
            date: m.date.toISOString().split('T')[0],
            odometer: m.odometer,
            amount: m.amount,
            workshop: m.workshop,
            description: m.description,
            nextDueDate: m.nextDueDate ? m.nextDueDate.toISOString().split('T')[0] : undefined,
            nextDueOdometer: m.nextDueOdometer,
            notes: m.notes,
            status: m.status,
            createdAt: m.createdAt?.toISOString(),
            updatedAt: m.updatedAt?.toISOString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB getMaintenanceRecordById failed:', e);
      }
    }

    const db = getMemoryDb();
    return db.maintenanceRecords.find((m) => (m.id === id || m._id === id) && m.userId === userId) || null;
  }

  static async createMaintenanceRecord(userId: string, data: Partial<MaintenanceRecordType>): Promise<MaintenanceRecordType> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await MaintenanceRecord.create({
          userId,
          bikeId: data.bikeId,
          serviceType: data.serviceType || 'General service',
          date: new Date(data.date || Date.now()),
          odometer: data.odometer,
          amount: data.amount || 0,
          workshop: data.workshop,
          description: data.description,
          nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
          nextDueOdometer: data.nextDueOdometer,
          notes: data.notes,
          status: data.status || 'completed',
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          bikeId: doc.bikeId.toString(),
          serviceType: doc.serviceType as MaintenanceRecordType['serviceType'],
          date: doc.date.toISOString().split('T')[0],
          odometer: doc.odometer,
          amount: doc.amount,
          workshop: doc.workshop,
          description: doc.description,
          nextDueDate: doc.nextDueDate?.toISOString().split('T')[0],
          nextDueOdometer: doc.nextDueOdometer,
          notes: doc.notes,
          status: doc.status,
        };
      } catch (e) {
        console.warn('MongoDB create maintenance record failed:', e);
      }
    }

    const db = getMemoryDb();
    const newRecord: MaintenanceRecordType = {
      id: generateId(),
      userId,
      bikeId: data.bikeId || '',
      serviceType: data.serviceType || 'General service',
      date: data.date || new Date().toISOString().split('T')[0],
      odometer: data.odometer || 0,
      amount: data.amount || 0,
      workshop: data.workshop,
      description: data.description || '',
      nextDueDate: data.nextDueDate,
      nextDueOdometer: data.nextDueOdometer,
      notes: data.notes,
      status: data.status || 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.maintenanceRecords.unshift(newRecord);
    return newRecord;
  }

  static async updateMaintenanceRecord(id: string, userId: string, data: Partial<MaintenanceRecordType>): Promise<MaintenanceRecordType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const updateData: Record<string, unknown> = { ...data };
        if (data.date) updateData.date = new Date(data.date);
        if (data.nextDueDate) updateData.nextDueDate = new Date(data.nextDueDate);
        const doc = await MaintenanceRecord.findOneAndUpdate({ _id: id, userId }, { $set: updateData }, { new: true }).lean();
        if (doc) {
          return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bikeId: doc.bikeId.toString(),
            serviceType: doc.serviceType as MaintenanceRecordType['serviceType'],
            date: doc.date.toISOString().split('T')[0],
            odometer: doc.odometer,
            amount: doc.amount,
            workshop: doc.workshop,
            description: doc.description,
            nextDueDate: doc.nextDueDate?.toISOString().split('T')[0],
            nextDueOdometer: doc.nextDueOdometer,
            notes: doc.notes,
            status: doc.status,
          };
        }
      } catch (e) {
        console.warn('MongoDB update maintenance record failed:', e);
      }
    }

    const db = getMemoryDb();
    const idx = db.maintenanceRecords.findIndex((m) => (m.id === id || m._id === id) && m.userId === userId);
    if (idx !== -1) {
      db.maintenanceRecords[idx] = { ...db.maintenanceRecords[idx], ...data, updatedAt: new Date().toISOString() };
      return db.maintenanceRecords[idx];
    }
    return null;
  }

  static async deleteMaintenanceRecord(id: string, userId: string): Promise<boolean> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const res = await MaintenanceRecord.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (e) {
        console.warn('MongoDB delete maintenance record failed:', e);
      }
    }

    const db = getMemoryDb();
    const initLen = db.maintenanceRecords.length;
    db.maintenanceRecords = db.maintenanceRecords.filter((m) => !((m.id === id || m._id === id) && m.userId === userId));
    return db.maintenanceRecords.length < initLen;
  }

  // ================= BIKE CARE RULES =================
  static async getBikeCareRules(userId: string, bikeId?: string): Promise<BikeCareRuleType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        const docs = await BikeCareRule.find(query).lean();
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
        }));
      } catch (e) {
        console.warn('MongoDB getBikeCareRules failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    let rules = db.bikeCareRules.filter((r) => r.userId === userId);
    if (bikeId) {
      rules = rules.filter((r) => r.bikeId === bikeId);
    }
    return rules;
  }

  static async getBikeCareRuleByCategory(userId: string, bikeId: string, category: string): Promise<BikeCareRuleType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await BikeCareRule.findOne({ userId, bikeId, category: { $regex: new RegExp(`^${category}$`, 'i') } }).lean();
        if (doc) {
          const d = doc as any;
          return {
            ...d,
            id: d._id.toString(),
            _id: d._id.toString(),
            userId: d.userId.toString(),
            bikeId: d.bikeId.toString(),
          };
        }
      } catch (e) {
        console.warn('MongoDB getBikeCareRuleByCategory failed, fallback:', e);
      }
    }

    const db = getMemoryDb();
    const found = db.bikeCareRules.find(
      (r) => r.userId === userId && r.bikeId === bikeId && r.category.toLowerCase() === category.toLowerCase()
    );
    return found || null;
  }

  static async upsertBikeCareRule(userId: string, data: Partial<BikeCareRuleType>): Promise<BikeCareRuleType> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const filter = { userId, bikeId: data.bikeId, category: data.category };
        const update = { ...data, userId, enabled: data.enabled ?? true };
        const doc = await BikeCareRule.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
        const d = doc as any;
        return {
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
        };
      } catch (e) {
        console.warn('MongoDB upsertBikeCareRule failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    const idx = db.bikeCareRules.findIndex(
      (r) => r.userId === userId && r.bikeId === data.bikeId && r.category.toLowerCase() === (data.category || '').toLowerCase()
    );

    const now = new Date().toISOString();
    if (idx >= 0) {
      const updated: BikeCareRuleType = {
        ...db.bikeCareRules[idx],
        ...data,
        updatedAt: now,
      };
      db.bikeCareRules[idx] = updated;
      return updated;
    } else {
      const id = generateId();
      const created: BikeCareRuleType = {
        id,
        _id: id,
        userId,
        bikeId: data.bikeId!,
        category: data.category!,
        defaultIntervalKm: data.defaultIntervalKm,
        defaultIntervalDays: data.defaultIntervalDays,
        intervalMode: data.intervalMode || 'KM_OR_DAYS',
        enabled: data.enabled ?? true,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };
      db.bikeCareRules.push(created);
      return created;
    }
  }

  static async deleteBikeCareRule(userId: string, id: string): Promise<boolean> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const res = await BikeCareRule.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (e) {
        console.warn('MongoDB deleteBikeCareRule failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    const initLen = db.bikeCareRules.length;
    db.bikeCareRules = db.bikeCareRules.filter((r) => !((r.id === id || r._id === id) && r.userId === userId));
    return db.bikeCareRules.length < initLen;
  }

  // ================= BIKE CARE RECORDS =================
  static async getBikeCareRecords(userId: string, bikeId?: string, category?: string): Promise<BikeCareRecordType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        if (category) query.category = category;
        const docs = await BikeCareRecord.find(query).sort({ performedAt: -1 }).lean();
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
          performedAt: d.performedAt instanceof Date ? d.performedAt.toISOString().split('T')[0] : d.performedAt,
          nextDueDate: d.nextDueDate instanceof Date ? d.nextDueDate.toISOString().split('T')[0] : d.nextDueDate,
        }));
      } catch (e) {
        console.warn('MongoDB getBikeCareRecords failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    let records = db.bikeCareRecords.filter((r) => r.userId === userId);
    if (bikeId) records = records.filter((r) => r.bikeId === bikeId);
    if (category) records = records.filter((r) => r.category.toLowerCase() === category.toLowerCase());
    return records.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }

  static async getBikeCareRecordById(userId: string, id: string): Promise<BikeCareRecordType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await BikeCareRecord.findOne({ _id: id, userId }).lean();
        if (doc) {
          const d = doc as any;
          return {
            ...d,
            id: d._id.toString(),
            _id: d._id.toString(),
            userId: d.userId.toString(),
            bikeId: d.bikeId.toString(),
            performedAt: d.performedAt instanceof Date ? d.performedAt.toISOString().split('T')[0] : d.performedAt,
            nextDueDate: d.nextDueDate instanceof Date ? d.nextDueDate.toISOString().split('T')[0] : d.nextDueDate,
          };
        }
      } catch (e) {
        console.warn('MongoDB getBikeCareRecordById failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    const found = db.bikeCareRecords.find((r) => (r.id === id || r._id === id) && r.userId === userId);
    return found || null;
  }

  static async createBikeCareRecord(userId: string, data: Partial<BikeCareRecordType>): Promise<BikeCareRecordType> {
    const now = new Date().toISOString();
    const id = generateId();

    const recordObj: BikeCareRecordType = {
      id,
      _id: id,
      userId,
      bikeId: data.bikeId!,
      category: data.category!,
      subCategory: data.subCategory,
      performedAt: data.performedAt || now.split('T')[0],
      performedAtOdometer: Number(data.performedAtOdometer) || 0,
      description: data.description || `${data.category} service`,
      performedBy: data.performedBy || 'SELF',
      providerName: data.providerName,
      location: data.location,
      cost: Number(data.cost) || 0,
      paymentMethod: data.paymentMethod || 'UPI',
      duration: data.duration,
      notes: data.notes,
      receiptUrl: data.receiptUrl,
      nextDueDate: data.nextDueDate,
      nextDueOdometer: data.nextDueOdometer ? Number(data.nextDueOdometer) : undefined,
      reminderEnabled: data.reminderEnabled ?? true,
      status: data.status || 'completed',
      createdAt: now,
      updatedAt: now,
    };

    // Synchronize bike odometer if newer
    if (data.bikeId && recordObj.performedAtOdometer > 0) {
      const bike = await this.getBikeById(data.bikeId, userId);
      if (bike && recordObj.performedAtOdometer > bike.currentOdometer) {
        await this.updateBike(data.bikeId, userId, { currentOdometer: recordObj.performedAtOdometer });
      }
    }

    // Auto-integrate with Expenses without duplicate double-counting
    if (recordObj.cost > 0) {
      await this.createExpense(userId, {
        bikeId: recordObj.bikeId,
        date: recordObj.performedAt,
        category: recordObj.category === 'Bike Wash' ? 'Cleaning' : 'Maintenance',
        amount: recordObj.cost,
        odometer: recordObj.performedAtOdometer,
        description: `Bike Care: ${recordObj.category} (${recordObj.performedBy})`,
        notes: recordObj.description,
        sourceType: 'BIKE_CARE',
        sourceId: recordObj.id,
      });
    }

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const created = await BikeCareRecord.create({
          ...recordObj,
          _id: id,
          performedAt: new Date(recordObj.performedAt),
          nextDueDate: recordObj.nextDueDate ? new Date(recordObj.nextDueDate) : undefined,
        });
        const d = created.toObject() as any;
        return {
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
          performedAt: d.performedAt instanceof Date ? d.performedAt.toISOString().split('T')[0] : String(d.performedAt),
          nextDueDate: d.nextDueDate ? (d.nextDueDate instanceof Date ? d.nextDueDate.toISOString().split('T')[0] : String(d.nextDueDate)) : undefined,
          createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt || now),
          updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : (d.updatedAt || now),
        };
      } catch (e) {
        console.warn('MongoDB createBikeCareRecord failed, stored in memory:', e);
      }
    }

    const db = getMemoryDb();
    db.bikeCareRecords.unshift(recordObj);
    return recordObj;
  }

  static async updateBikeCareRecord(userId: string, id: string, data: Partial<BikeCareRecordType>): Promise<BikeCareRecordType | null> {
    const existing = await this.getBikeCareRecordById(userId, id);
    if (!existing) return null;

    const updatedOdo = data.performedAtOdometer ? Number(data.performedAtOdometer) : existing.performedAtOdometer;
    if (existing.bikeId && updatedOdo > 0) {
      const bike = await this.getBikeById(existing.bikeId, userId);
      if (bike && updatedOdo > bike.currentOdometer) {
        await this.updateBike(existing.bikeId, userId, { currentOdometer: updatedOdo });
      }
    }

    // Synchronize linked expense
    const newCost = data.cost !== undefined ? Number(data.cost) : existing.cost;
    const db = getMemoryDb();
    const existingExp = db.expenses.find((e) => e.sourceType === 'BIKE_CARE' && e.sourceId === id);

    if (newCost > 0) {
      if (existingExp) {
        await this.updateExpense(existingExp.id, userId, {
          amount: newCost,
          date: data.performedAt || existing.performedAt,
          description: `Bike Care: ${data.category || existing.category} (${data.performedBy || existing.performedBy})`,
          odometer: updatedOdo,
        });
      } else {
        await this.createExpense(userId, {
          bikeId: existing.bikeId,
          date: data.performedAt || existing.performedAt,
          category: (data.category || existing.category) === 'Bike Wash' ? 'Cleaning' : 'Maintenance',
          amount: newCost,
          odometer: updatedOdo,
          description: `Bike Care: ${data.category || existing.category}`,
          sourceType: 'BIKE_CARE',
          sourceId: id,
        });
      }
    } else if (existingExp && newCost === 0) {
      await this.deleteExpense(existingExp.id, userId);
    }

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
        if (data.performedAt) updatePayload.performedAt = new Date(data.performedAt);
        if (data.nextDueDate) updatePayload.nextDueDate = new Date(data.nextDueDate);

        const doc = await BikeCareRecord.findOneAndUpdate({ _id: id, userId }, updatePayload, { new: true }).lean();
        if (doc) {
          const d = doc as any;
          return {
            ...d,
            id: d._id.toString(),
            _id: d._id.toString(),
            userId: d.userId.toString(),
            bikeId: d.bikeId.toString(),
            performedAt: d.performedAt instanceof Date ? d.performedAt.toISOString().split('T')[0] : d.performedAt,
            nextDueDate: d.nextDueDate instanceof Date ? d.nextDueDate.toISOString().split('T')[0] : d.nextDueDate,
            createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt || new Date().toISOString()),
            updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : (d.updatedAt || new Date().toISOString()),
          };
        }
      } catch (e) {
        console.warn('MongoDB updateBikeCareRecord failed, updating in memory:', e);
      }
    }

    const idx = db.bikeCareRecords.findIndex((r) => (r.id === id || r._id === id) && r.userId === userId);
    if (idx >= 0) {
      const merged: BikeCareRecordType = {
        ...db.bikeCareRecords[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      db.bikeCareRecords[idx] = merged;
      return merged;
    }
    return null;
  }

  static async deleteBikeCareRecord(userId: string, id: string): Promise<boolean> {
    // Delete linked expense
    const db = getMemoryDb();
    const linkedExp = db.expenses.find((e) => e.sourceType === 'BIKE_CARE' && e.sourceId === id);
    if (linkedExp) {
      await this.deleteExpense(linkedExp.id, userId);
    }

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        await Expense.deleteMany({ userId, sourceType: 'BIKE_CARE', sourceId: id });
        const res = await BikeCareRecord.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (e) {
        console.warn('MongoDB deleteBikeCareRecord failed, deleting in memory:', e);
      }
    }

    const initLen = db.bikeCareRecords.length;
    db.bikeCareRecords = db.bikeCareRecords.filter((r) => !((r.id === id || r._id === id) && r.userId === userId));
    return db.bikeCareRecords.length < initLen;
  }

  // ================= SERVICE RECORDS =================
  static async getServiceRecords(userId: string, bikeId?: string): Promise<ServiceRecordType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        const docs = await ServiceRecord.find(query).sort({ serviceDate: -1 }).lean();
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
          serviceDate: d.serviceDate instanceof Date ? d.serviceDate.toISOString().split('T')[0] : d.serviceDate,
          nextServiceDate: d.nextServiceDate instanceof Date ? d.nextServiceDate.toISOString().split('T')[0] : d.nextServiceDate,
        }));
      } catch (e) {
        console.warn('MongoDB getServiceRecords failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    let records = db.serviceRecords.filter((r) => r.userId === userId);
    if (bikeId) records = records.filter((r) => r.bikeId === bikeId);
    return records.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  }

  static async getServiceRecordById(userId: string, id: string): Promise<ServiceRecordType | null> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const doc = await ServiceRecord.findOne({ _id: id, userId }).lean();
        if (doc) {
          const d = doc as any;
          return {
            ...d,
            id: d._id.toString(),
            _id: d._id.toString(),
            userId: d.userId.toString(),
            bikeId: d.bikeId.toString(),
            serviceDate: d.serviceDate instanceof Date ? d.serviceDate.toISOString().split('T')[0] : d.serviceDate,
            nextServiceDate: d.nextServiceDate instanceof Date ? d.nextServiceDate.toISOString().split('T')[0] : d.nextServiceDate,
          };
        }
      } catch (e) {
        console.warn('MongoDB getServiceRecordById failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    const found = db.serviceRecords.find((r) => (r.id === id || r._id === id) && r.userId === userId);
    return found || null;
  }

  static async createServiceRecord(userId: string, data: Partial<ServiceRecordType>): Promise<ServiceRecordType> {
    const now = new Date().toISOString();
    const id = generateId();

    const items = data.items || [];
    const partsCost = items.reduce((acc, i) => acc + (Number(i.totalPrice) || 0), 0);
    const labourCost = Number(data.labourCost) || 0;
    const otherCost = Number(data.otherCost) || 0;
    const totalCost = Number(data.totalCost) || (partsCost + labourCost + otherCost);

    const srvNumber = data.serviceNumber || `SRV-${String(Date.now()).slice(-4)}`;

    const srvObj: ServiceRecordType = {
      id,
      _id: id,
      userId,
      bikeId: data.bikeId!,
      serviceNumber: srvNumber,
      serviceDate: data.serviceDate || now.split('T')[0],
      odometer: Number(data.odometer) || 0,
      serviceCenter: data.serviceCenter || 'Authorized Service',
      serviceType: data.serviceType || 'Scheduled Service',
      totalCost,
      labourCost,
      partsCost,
      otherCost,
      description: data.description || 'Periodic maintenance service',
      notes: data.notes,
      items,
      nextServiceDate: data.nextServiceDate,
      nextServiceOdometer: data.nextServiceOdometer ? Number(data.nextServiceOdometer) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Synchronize bike odometer
    if (data.bikeId && srvObj.odometer > 0) {
      const bike = await this.getBikeById(data.bikeId, userId);
      if (bike && srvObj.odometer > bike.currentOdometer) {
        await this.updateBike(data.bikeId, userId, { currentOdometer: srvObj.odometer });
      }
    }

    // Auto-integrate with Expenses
    if (srvObj.totalCost > 0) {
      await this.createExpense(userId, {
        bikeId: srvObj.bikeId,
        date: srvObj.serviceDate,
        category: 'Maintenance',
        amount: srvObj.totalCost,
        odometer: srvObj.odometer,
        description: `Service: ${srvObj.serviceNumber} - ${srvObj.serviceType}`,
        notes: srvObj.description,
        sourceType: 'SERVICE',
        sourceId: srvObj.id,
      });
    }

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const created = await ServiceRecord.create({
          ...srvObj,
          _id: id,
          serviceDate: new Date(srvObj.serviceDate),
          nextServiceDate: srvObj.nextServiceDate ? new Date(srvObj.nextServiceDate) : undefined,
        });
        const d = created.toObject() as any;
        return {
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
          serviceDate: d.serviceDate instanceof Date ? d.serviceDate.toISOString().split('T')[0] : String(d.serviceDate),
          nextServiceDate: d.nextServiceDate ? (d.nextServiceDate instanceof Date ? d.nextServiceDate.toISOString().split('T')[0] : String(d.nextServiceDate)) : undefined,
          createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt || now),
          updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : (d.updatedAt || now),
        };
      } catch (e) {
        console.warn('MongoDB createServiceRecord failed, stored in memory:', e);
      }
    }

    const db = getMemoryDb();
    db.serviceRecords.unshift(srvObj);
    return srvObj;
  }

  static async updateServiceRecord(userId: string, id: string, data: Partial<ServiceRecordType>): Promise<ServiceRecordType | null> {
    const existing = await this.getServiceRecordById(userId, id);
    if (!existing) return null;

    const items = data.items || existing.items;
    const partsCost = items.reduce((acc, i) => acc + (Number(i.totalPrice) || 0), 0);
    const labourCost = data.labourCost !== undefined ? Number(data.labourCost) : existing.labourCost;
    const otherCost = data.otherCost !== undefined ? Number(data.otherCost) : existing.otherCost;
    const totalCost = data.totalCost !== undefined ? Number(data.totalCost) : (partsCost + labourCost + otherCost);

    const updatedOdo = data.odometer ? Number(data.odometer) : existing.odometer;
    if (existing.bikeId && updatedOdo > 0) {
      const bike = await this.getBikeById(existing.bikeId, userId);
      if (bike && updatedOdo > bike.currentOdometer) {
        await this.updateBike(existing.bikeId, userId, { currentOdometer: updatedOdo });
      }
    }

    // Synchronize expense
    const db = getMemoryDb();
    const linkedExp = db.expenses.find((e) => e.sourceType === 'SERVICE' && e.sourceId === id);
    if (totalCost > 0) {
      if (linkedExp) {
        await this.updateExpense(linkedExp.id, userId, {
          amount: totalCost,
          date: data.serviceDate || existing.serviceDate,
          description: `Service: ${data.serviceNumber || existing.serviceNumber} - ${data.serviceType || existing.serviceType}`,
          odometer: updatedOdo,
        });
      } else {
        await this.createExpense(userId, {
          bikeId: existing.bikeId,
          date: data.serviceDate || existing.serviceDate,
          category: 'Maintenance',
          amount: totalCost,
          odometer: updatedOdo,
          description: `Service: ${data.serviceNumber || existing.serviceNumber}`,
          sourceType: 'SERVICE',
          sourceId: id,
        });
      }
    } else if (linkedExp && totalCost === 0) {
      await this.deleteExpense(linkedExp.id, userId);
    }

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const updatePayload: Record<string, unknown> = {
          ...data,
          partsCost,
          labourCost,
          otherCost,
          totalCost,
          updatedAt: new Date(),
        };
        if (data.serviceDate) updatePayload.serviceDate = new Date(data.serviceDate);
        if (data.nextServiceDate) updatePayload.nextServiceDate = new Date(data.nextServiceDate);

        const doc = await ServiceRecord.findOneAndUpdate({ _id: id, userId }, updatePayload, { new: true }).lean();
        if (doc) {
          const d = doc as any;
          return {
            ...d,
            id: d._id.toString(),
            _id: d._id.toString(),
            userId: d.userId.toString(),
            bikeId: d.bikeId.toString(),
            serviceDate: d.serviceDate instanceof Date ? d.serviceDate.toISOString().split('T')[0] : d.serviceDate,
            nextServiceDate: d.nextServiceDate instanceof Date ? d.nextServiceDate.toISOString().split('T')[0] : d.nextServiceDate,
            createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt || new Date().toISOString()),
            updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : (d.updatedAt || new Date().toISOString()),
          };
        }
      } catch (e) {
        console.warn('MongoDB updateServiceRecord failed, updating memory:', e);
      }
    }

    const idx = db.serviceRecords.findIndex((r) => (r.id === id || r._id === id) && r.userId === userId);
    if (idx >= 0) {
      const merged: ServiceRecordType = {
        ...db.serviceRecords[idx],
        ...data,
        partsCost,
        labourCost,
        otherCost,
        totalCost,
        updatedAt: new Date().toISOString(),
      };
      db.serviceRecords[idx] = merged;
      return merged;
    }
    return null;
  }

  static async deleteServiceRecord(userId: string, id: string): Promise<boolean> {
    const db = getMemoryDb();
    const linkedExp = db.expenses.find((e) => e.sourceType === 'SERVICE' && e.sourceId === id);
    if (linkedExp) {
      await this.deleteExpense(linkedExp.id, userId);
    }

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        await Expense.deleteMany({ userId, sourceType: 'SERVICE', sourceId: id });
        const res = await ServiceRecord.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (e) {
        console.warn('MongoDB deleteServiceRecord failed, memory fallback:', e);
      }
    }

    const initLen = db.serviceRecords.length;
    db.serviceRecords = db.serviceRecords.filter((r) => !((r.id === id || r._id === id) && r.userId === userId));
    return db.serviceRecords.length < initLen;
  }

  // ================= NOTIFICATIONS =================
  static async getNotifications(userId: string, bikeId?: string): Promise<NotificationItemType[]> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const query: Record<string, unknown> = { userId };
        if (bikeId) query.bikeId = bikeId;
        const docs = await Notification.find(query).sort({ read: 1, createdAt: -1 }).lean();
        return docs.map((d: any) => ({
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
          createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
        }));
      } catch (e) {
        console.warn('MongoDB getNotifications failed, fallback to memory:', e);
      }
    }

    const db = getMemoryDb();
    let notifs = db.notifications.filter((n) => n.userId === userId);
    if (bikeId) notifs = notifs.filter((n) => n.bikeId === bikeId);
    return notifs.sort((a, b) => (a.read === b.read ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : a.read ? 1 : -1));
  }

  static async markNotificationRead(userId: string, id: string): Promise<boolean> {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const res = await Notification.updateOne({ _id: id, userId }, { read: true });
        return res.modifiedCount > 0;
      } catch (e) {
        console.warn('MongoDB markNotificationRead failed, memory fallback:', e);
      }
    }

    const db = getMemoryDb();
    const notif = db.notifications.find((n) => (n.id === id || n._id === id) && n.userId === userId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  static async createNotification(userId: string, data: Partial<NotificationItemType>): Promise<NotificationItemType> {
    const id = generateId();
    const notifObj: NotificationItemType = {
      id,
      _id: id,
      userId,
      bikeId: data.bikeId!,
      title: data.title || 'Maintenance Reminder',
      message: data.message || '',
      type: data.type || 'INFO',
      reminderType: data.reminderType || 'DATE_OR_ODOMETER',
      targetCategory: data.targetCategory || 'General Service',
      targetRoute: data.targetRoute || '/dashboard/bike-care',
      read: false,
      createdAt: new Date().toISOString(),
    };

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        const created = await Notification.create({ ...notifObj, _id: id });
        const d = created.toObject() as any;
        return {
          ...d,
          id: d._id.toString(),
          _id: d._id.toString(),
          userId: d.userId.toString(),
          bikeId: d.bikeId.toString(),
          createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt || notifObj.createdAt),
        };
      } catch (e) {
        console.warn('MongoDB createNotification failed, stored in memory:', e);
      }
    }

    const db = getMemoryDb();
    db.notifications.unshift(notifObj);
    return notifObj;
  }

  // ================= SEED RESET =================
  static async resetToSeed(): Promise<void> {
    const seed = getInitialSeedData();
    global.memoryDb = {
      users: seed.users,
      bikes: seed.bikes,
      fuelLogs: seed.fuelLogs,
      dailyReadings: seed.dailyReadings,
      expenses: seed.expenses,
      maintenanceRecords: seed.maintenanceRecords,
      bikeCareRules: seed.bikeCareRules,
      bikeCareRecords: seed.bikeCareRecords,
      serviceRecords: seed.serviceRecords,
      notifications: seed.notifications,
      initialized: true,
    };

    await connectToDatabase();
    if (isDatabaseConnected()) {
      try {
        await Promise.all([
          User.deleteMany({}),
          Bike.deleteMany({}),
          FuelLog.deleteMany({}),
          DailyReading.deleteMany({}),
          Expense.deleteMany({}),
          MaintenanceRecord.deleteMany({}),
          BikeCareRule.deleteMany({}),
          BikeCareRecord.deleteMany({}),
          ServiceRecord.deleteMany({}),
          Notification.deleteMany({}),
        ]);
        // Re-seed into MongoDB
        await User.insertMany(seed.users);
        await Bike.insertMany(seed.bikes);
        await FuelLog.insertMany(seed.fuelLogs);
        await DailyReading.insertMany(seed.dailyReadings);
        await Expense.insertMany(seed.expenses);
        await MaintenanceRecord.insertMany(seed.maintenanceRecords);
        await BikeCareRule.insertMany(seed.bikeCareRules);
        await BikeCareRecord.insertMany(seed.bikeCareRecords);
        await ServiceRecord.insertMany(seed.serviceRecords);
        await Notification.insertMany(seed.notifications);
      } catch (e) {
        console.warn('MongoDB reset seed error:', e);
      }
    }
  }
}
