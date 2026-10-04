export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  currency?: string;
  distanceUnit?: 'km' | 'miles';
  fuelUnit?: 'liters' | 'gallons';
  createdAt?: string;
  updatedAt?: string;
}

export interface Bike {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  manufacturer: string;
  model: string;
  variant?: string;
  year: number;
  registrationNumber?: string;
  purchaseDate?: string;
  initialOdometer: number;
  currentOdometer: number;
  tankCapacity: number; // in Liters (e.g. 13 for RE Classic 350)
  reserveCapacity?: number; // e.g. 2.6 Liters
  expectedMileage: number; // in km/l (e.g. 35)
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuelLog {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  date: string; // ISO date YYYY-MM-DD
  time?: string; // HH:mm
  odometer: number;
  fuelQuantity: number; // liters
  pricePerLiter: number;
  totalAmount: number;
  isFullTank: boolean;
  fuelStation?: string;
  location?: string;
  paymentMethod?: string; // Cash, Card, UPI, etc.
  notes?: string;
  distanceSincePrevious?: number | null;
  estimatedMileage?: number | null;
  costPerKm?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyReading {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  date: string;
  odometer: number;
  distance?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'Petrol'
  | 'Maintenance'
  | 'Repair'
  | 'Insurance'
  | 'Accessories'
  | 'Cleaning'
  | 'Parking'
  | 'Toll'
  | 'Other';

export type ExpenseSourceType = 'FUEL' | 'BIKE_CARE' | 'SERVICE' | 'REPAIR' | 'OTHER';

export interface Expense {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  odometer?: number;
  description: string;
  notes?: string;
  receiptUrl?: string;
  sourceType?: ExpenseSourceType;
  sourceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PerformedByType = 'SELF' | 'SERVICE_CENTER' | 'LOCAL_MECHANIC' | 'OTHER';
export type BikeCareStatus = 'completed' | 'upcoming' | 'due' | 'overdue';

export interface BikeCareRecord {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  category: string;
  subCategory?: string;
  performedAt: string; // ISO date YYYY-MM-DD
  performedAtOdometer: number;
  description: string;
  performedBy: PerformedByType;
  providerName?: string;
  location?: string;
  cost: number;
  paymentMethod?: string;
  duration?: string;
  notes?: string;
  receiptUrl?: string;
  nextDueDate?: string;
  nextDueOdometer?: number;
  reminderEnabled?: boolean;
  status: BikeCareStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type IntervalMode = 'KM' | 'DAYS' | 'KM_OR_DAYS' | 'KM_AND_DAYS';

export interface BikeCareRule {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  category: string;
  defaultIntervalKm?: number;
  defaultIntervalDays?: number;
  intervalMode: IntervalMode;
  enabled: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface ServiceRecord {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  serviceNumber: string; // e.g. "SRV-001"
  serviceDate: string; // YYYY-MM-DD
  odometer: number;
  serviceCenter: string;
  serviceType: string; // "General Service", "Oil & Filter Service", etc.
  totalCost: number;
  labourCost: number;
  partsCost: number;
  otherCost: number;
  description: string;
  notes?: string;
  items: ServiceItem[];
  nextServiceDate?: string;
  nextServiceOdometer?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type HealthStatusLevel = 'OK' | 'DUE SOON' | 'DUE' | 'OVERDUE' | 'NO DATA';

export interface BikeHealthItem {
  name: string; // "Engine Oil", "Chain Lubrication", "Chain Cleaning", "Bike Wash", "Brake Inspection", "Tyres", "Battery", "Air Filter", "General Service"
  status: HealthStatusLevel;
  lastDoneDate?: string;
  lastDoneOdometer?: number;
  nextDueDate?: string;
  nextDueOdometer?: number;
  remainingKm?: number;
  remainingDays?: number;
  notes?: string;
}

export interface BikeHealthScore {
  score: number; // 0 - 100
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'ATTENTION_NEEDED' | 'CRITICAL';
  summary: string;
  explanation: string;
  items: BikeHealthItem[];
  calculatedAt: string;
}

export interface UpcomingCareItem {
  id: string;
  category: string;
  type: 'bike_care' | 'service';
  dueDescription: string;
  nextDueDate?: string;
  nextDueOdometer?: number;
  remainingKm?: number;
  remainingDays?: number;
  isOverdue: boolean;
  urgency: 'high' | 'medium' | 'low';
  targetRoute: string;
}

export type FuelConfidence =
  | 'HIGH CONFIDENCE'
  | 'MEDIUM CONFIDENCE'
  | 'LOW CONFIDENCE'
  | 'INSUFFICIENT DATA';

export interface BikeStatusData {
  bike: Bike;
  currentOdometer: number;
  todaysDistance: number;
  estimatedFuel: number | null;
  estimatedRange: number | null;
  averageMileage: number | null;
  fuelConfidence: FuelConfidence;
  fuelExplanation: string;
  healthScore: BikeHealthScore;
  upcomingCare: UpcomingCareItem[];
  lastService: {
    id?: string;
    date: string;
    odometer: number;
    serviceCenter: string;
    totalCost: number;
    serviceNumber: string;
  } | null;
  nextService: {
    nextDate?: string;
    nextOdometer?: number;
    remainingKm?: number;
    remainingDays?: number;
    isOverdue: boolean;
  } | null;
  latestRecordedSpeed?: number;
}

export type NotificationType = 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE' | 'INFO';
export type ReminderType = 'DATE' | 'ODOMETER' | 'DATE_OR_ODOMETER';

export interface NotificationItem {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  title: string;
  message: string;
  type: NotificationType;
  reminderType: ReminderType;
  targetCategory: string;
  targetRoute: string;
  read: boolean;
  createdAt: string;
}

export type MaintenanceServiceType =
  | 'Engine oil'
  | 'Oil filter'
  | 'Air filter'
  | 'Chain cleaning'
  | 'Chain lubrication'
  | 'Brake inspection'
  | 'Brake replacement'
  | 'Tyres'
  | 'Battery'
  | 'General service'
  | 'Insurance'
  | 'PUC'
  | 'Repair'
  | 'Other';

export interface MaintenanceRecord {
  _id?: string;
  id: string;
  userId: string;
  bikeId: string;
  serviceType: MaintenanceServiceType;
  date: string;
  odometer: number;
  amount: number;
  workshop?: string;
  description: string;
  nextDueDate?: string;
  nextDueOdometer?: number;
  notes?: string;
  status?: 'completed' | 'upcoming' | 'overdue';
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  currentOdometer: number;
  todaysDistance: number;
  monthlyDistance: number;
  thisMonthsDistance: number;
  estimatedFuel: number | null; // Liters
  estimatedRange: number | null; // KM
  averageMileage: number | null; // KM/L
  recentMileage: number | null; // KM/L
  averageFuelPrice: number | null;
  averagePetrolPrice: number | null;
  totalFuelCost: number;
  totalFuelExpenditure: number;
  monthlyFuelCost: number;
  currentMonthFuelExpenditure: number;
  totalBikeExpenditure: number;
  costPerKm: number | null;
  costPerKilometer: number | null;
  lastFuelFill: {
    date: string;
    quantity: number;
    odometer: number;
    totalAmount: number;
    pricePerLiter?: number;
    station?: string;
  } | null;
  nextMaintenance: {
    serviceType: string;
    nextDueDate?: string;
    nextDueOdometer?: number;
    remainingKm?: number;
    daysRemaining?: number;
    isOverdue: boolean;
  } | null;
  healthScore?: BikeHealthScore;
  upcomingCare?: UpcomingCareItem[];
  overdueTasksCount?: number;
  upcomingTasksCount?: number;
  expenseBreakdown?: {
    thisMonthTotal: number;
    fuelTotal: number;
    maintenanceTotal: number;
    otherTotal: number;
  };
  todayStats?: {
    distance: number;
    fuelConsumed: number | null;
    estimatedCost: number | null;
  };
}

export interface DashboardChartsData {
  mileageOverTime: {
    date: string;
    mileage: number;
    isFullTank: boolean;
    odometer: number;
  }[];
  monthlyDistance: {
    month: string;
    distance: number;
  }[];
  monthlyFuelConsumption: {
    month: string;
    liters: number;
  }[];
  monthlyFuelExpense: {
    month: string;
    amount: number;
  }[];
  petrolPriceTrend: {
    date: string;
    price: number;
    station: string;
  }[];
  costPerKmTrend: {
    date: string;
    costPerKm: number;
  }[];
  maintenanceExpenses: {
    month: string;
    amount: number;
  }[];
  totalExpensesByCategory: {
    category: string;
    amount: number;
    color: string;
  }[];
}

export type TimeRangeFilter = '7d' | '30d' | '3m' | '6m' | '1y' | 'all' | 'custom';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
