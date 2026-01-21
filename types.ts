
export type Role = 'ADMIN' | 'MANAGER' | 'DRIVER';

export type DriverStatus = 'official' | 'probation' | 'quit';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string;
  status: DriverStatus;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: Role;
  name: string;
  driverId?: string;
  permissions?: string[];
  isBlocked?: boolean;
}

export type VehicleCategory = 'TRUCK' | 'TRACTOR' | 'TRAILER';

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  category: VehicleCategory;
  status: 'active' | 'maintenance';
  operationStartDate?: string;
  registrationExpiry?: string;
  registrationNumber?: string;
  initialOdometer?: number;
}

export interface Assignment {
  id: string;
  driverId: string;
  vehicleId: string;
  trailerId?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export type FuelRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface FuelRequest {
  id: string;
  driverId: string;
  vehicleId: string;
  currentOdometer?: number;
  requestDate: string;
  status: FuelRequestStatus;
  notes?: string;
  isTemporary?: boolean;
  
  // Estimation / Request
  amountLitres?: number;

  // Admin Approval
  gasStation?: string;
  isFullTank?: boolean;
  approvedCost?: number;
  approvedLitres?: number;
  approvedDate?: string;

  // Actual / Completion (New)
  actualCost?: number;
  actualLitres?: number;
  completedDate?: string;
}

export type AdvanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MoneyAdvance {
  id: string;
  driverId: string;
  amount: number;
  date: string;
  category?: string;
  reason: string;
  createdAt: string;
  status: AdvanceStatus;
  approvedDate?: string;
}

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DriverExpense {
  id: string;
  driverId: string;
  amount: number;
  date: string;
  category?: string;
  reason: string;
  createdAt: string;
  status: ExpenseStatus;
  approvedDate?: string;
  
  vehicleId?: string;
  trailerId?: string;

  tireDetails?: {
    tractorPositions: number[];
    trailerPositions: number[];
    description?: string;
    odometerAtRepair?: number;
  };
}

export interface TireReplacement {
  id: string;
  vehicleId: string;
  date: string;
  positions: number[];
  
  brand: string;
  size: string;
  patternCode?: string;
  serialNumber?: string;
  
  cost: number;
  provider?: string;
  notes?: string;
  
  odometerAtInstall?: number;
  
  createdAt: string;
}

export interface DriverSalary {
  id: string;
  date: string; 
  driverName: string;
  cargoType: string;
  warehouse: string;
  warehouseLocation: string;
  depot: string;
  dropReturn: string;
  containerNo: string;
  quantity: string;
  count20: number;
  count40: number;
  tripSalary: number;
  handlingFee: number;
  
  createdAt: string;
}

// Dữ liệu gốc (Import) - 12 Cột
export interface PayOnBehalf {
  id: string;
  vehiclePlate: string;
  date: string;
  operation: string;
  warehouse: string;
  depot: string;
  location: string;
  dropReturn: string;
  count20: number;
  count40: number;
  containerNo: string;
  bookingDo: string;
  customerReconciliation: string;

  amount?: number;

  createdAt: string;
  hasSlipGenerated?: boolean; 
}

// Bảng dữ liệu chi hộ riêng (Phiếu chi thực tế)
export interface PayOnBehalfSlip {
  id: string;
  refId: string; 
  
  date: string;
  amount: number;
  recipient: string; 
  reason: string; 
  
  containerNo?: string;
  vehiclePlate?: string;

  createdAt: string;
}

export interface RefundEntry {
  containerNo: string;
  refundDate: string;
  refundAmount: number;
  updatedAt: string;
}

export interface PaymentRecipient {
  id: string;
  name: string;
  type: 'DEPOT' | 'DRIVER' | 'OTHER';
}

export interface PayOnBehalfReason {
  id: string;
  name: string;
}

export interface DailyOdometer {
  id: string;
  vehicleId: string;
  date: string;
  distance: number;
  createdAt: string;
}

export interface FuelPrice {
  id: string;
  price: number;
  effectiveDate: string;
  notes?: string;
}

export interface GasStation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  isDefault?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  usage: 'ADVANCE' | 'EXPENSE' | 'BOTH';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  validUntil: string;
  priority: 'normal' | 'high';
  createdAt: string;
}

export interface ReadReceipt {
  announcementId: string;
  userId: string;
  readAt: string;
}

export interface AssignmentDisplay extends Assignment {
  driverName: string;
  vehiclePlate: string;
  trailerPlate?: string;
  isActive: boolean;
}
