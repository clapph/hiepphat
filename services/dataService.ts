
// ... existing imports
import { 
  Driver, Vehicle, Assignment, FuelRequest, MoneyAdvance, 
  DriverExpense, UserAccount, TireReplacement, DriverSalary, 
  PayOnBehalf, PayOnBehalfSlip, DailyOdometer, FuelPrice, GasStation, 
  ExpenseCategory, PaymentRecipient, ExpenseStatus, AdvanceStatus,
  PayOnBehalfReason, Announcement, ReadReceipt, RefundEntry
} from '../types';

const KEYS = {
  // ... existing keys
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  ASSIGNMENTS: 'assignments',
  FUEL_REQUESTS: 'fuel_requests',
  MONEY_ADVANCES: 'money_advances',
  DRIVER_EXPENSES: 'driver_expenses',
  USERS: 'users',
  TIRE_REPLACEMENTS: 'tire_replacements',
  DRIVER_SALARIES: 'driver_salaries',
  PAY_ON_BEHALF: 'pay_on_behalf',
  PAY_ON_BEHALF_SLIPS: 'pay_on_behalf_slips', 
  REFUND_ENTRIES: 'refund_entries', // New Key
  DAILY_ODOMETERS: 'daily_odometers',
  FUEL_PRICES: 'fuel_prices',
  GAS_STATIONS: 'gas_stations',
  EXPENSE_CATEGORIES: 'expense_categories',
  PAYMENT_RECIPIENTS: 'payment_recipients',
  PAY_ON_BEHALF_REASONS: 'pay_on_behalf_reasons',
  ANNOUNCEMENTS: 'announcements',
  READ_RECEIPTS: 'read_receipts'
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// ... (existing constants) ...
const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Nguyễn Văn A', phone: '0901234567', licenseNumber: '79A12345', status: 'official', licenseExpiry: '2025-12-31' },
  { id: 'd2', name: 'Trần Văn B', phone: '0909876543', licenseNumber: '79A67890', status: 'official', licenseExpiry: '2024-06-30' },
];

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', plateNumber: '59C-123.45', type: 'Xe tải 8 tấn', category: 'TRUCK', status: 'active', initialOdometer: 120000, registrationExpiry: '2024-12-31' },
  { id: 'v2', plateNumber: '51D-987.65', type: 'Đầu kéo Mỹ', category: 'TRACTOR', status: 'active', initialOdometer: 350000, registrationExpiry: '2024-10-15' },
  { id: 'v3', plateNumber: '51R-111.22', type: 'Rơ-moóc xương', category: 'TRAILER', status: 'active', registrationExpiry: '2025-01-20' },
];

const INITIAL_USERS: UserAccount[] = [
  { id: 'u1', username: 'admin', password: '123', role: 'ADMIN', name: 'Quản trị viên' },
  { id: 'u2', username: 'tx01', password: '123', role: 'DRIVER', name: 'Nguyễn Văn A', driverId: 'd1' },
];

const INITIAL_RECIPIENTS: PaymentRecipient[] = [
    { id: 'r1', name: 'Cảng Cát Lái', type: 'DEPOT' },
    { id: 'r2', name: 'Cảng VICT', type: 'DEPOT' },
];

const INITIAL_POB_REASONS: PayOnBehalfReason[] = [
    { id: 'reason1', name: 'Cược Sửa Chữa (Cược vỏ)' },
    { id: 'reason2', name: 'Vé Cổng' },
    { id: 'reason3', name: 'Phí Nâng Hạ' },
    { id: 'reason4', name: 'Phí Vệ Sinh' },
];

const INITIAL_CATEGORIES: ExpenseCategory[] = [
    { id: 'c1', name: 'Ăn uống', usage: 'BOTH', description: 'Chi phí ăn uống dọc đường' },
    { id: 'c2', name: 'Vá vỏ', usage: 'EXPENSE', description: 'Sửa chữa lốp xe' },
    { id: 'c3', name: 'Luật đường bộ', usage: 'EXPENSE', description: 'Chi phí không chứng từ' },
    { id: 'c4', name: 'Tạm ứng lương', usage: 'ADVANCE', description: 'Ứng lương kỳ này' },
];

const INITIAL_STATIONS: GasStation[] = [
    { id: 's1', name: 'Petrolimex 01', address: 'Xa lộ Hà Nội, TP.HCM', status: 'active', isDefault: true }
];

const INITIAL_PRICES: FuelPrice[] = [
    { id: 'fp1', price: 21500, effectiveDate: '2023-01-01T00:00:00.000Z', notes: 'Giá đầu năm' }
];

export const DataService = {
  // ... (keep existing methods: DRIVERS, VEHICLES, ASSIGNMENTS, FUEL_REQUESTS, MONEY_ADVANCES, DRIVER_EXPENSES, TIRE_REPLACEMENTS, USERS, DRIVER_SALARIES, PAY_ON_BEHALF, PAY_ON_BEHALF_SLIPS, PAYMENT_RECIPIENTS, PAY_ON_BEHALF_REASONS, DAILY_ODOMETERS, FUEL_PRICES, GAS_STATIONS, EXPENSE_CATEGORIES, ANNOUNCEMENTS, READ_RECEIPTS) ...
  // --- DRIVERS ---
  getDrivers: (): Driver[] => {
    const data = localStorage.getItem(KEYS.DRIVERS);
    return data ? JSON.parse(data) : INITIAL_DRIVERS;
  },
  saveDriver: (driver: Driver) => {
    const drivers = DataService.getDrivers();
    if (driver.id) {
      const index = drivers.findIndex(d => d.id === driver.id);
      if (index !== -1) drivers[index] = driver;
    } else {
      driver.id = generateId();
      drivers.push(driver);
    }
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers));
  },
  deleteDriver: (id: string) => {
    const drivers = DataService.getDrivers().filter(d => d.id !== id);
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers));
  },

  // --- VEHICLES ---
  getVehicles: (): Vehicle[] => {
    const data = localStorage.getItem(KEYS.VEHICLES);
    return data ? JSON.parse(data) : INITIAL_VEHICLES;
  },
  saveVehicle: (vehicle: Vehicle) => {
    const vehicles = DataService.getVehicles();
    if (vehicle.id) {
      const index = vehicles.findIndex(v => v.id === vehicle.id);
      if (index !== -1) vehicles[index] = vehicle;
    } else {
      vehicle.id = generateId();
      vehicles.push(vehicle);
    }
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
  },
  deleteVehicle: (id: string) => {
    const vehicles = DataService.getVehicles().filter(v => v.id !== id);
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
  },

  // --- ASSIGNMENTS ---
  getAssignments: (): Assignment[] => {
    const data = localStorage.getItem(KEYS.ASSIGNMENTS);
    return data ? JSON.parse(data) : [];
  },
  addAssignment: (assign: Omit<Assignment, 'id' | 'createdAt'>) => {
    const assignments = DataService.getAssignments();
    const newAssign = {
      ...assign,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    assignments.push(newAssign);
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  },
  updateAssignment: (id: string, data: Partial<Assignment>) => {
    const assignments = DataService.getAssignments();
    const index = assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      assignments[index] = { ...assignments[index], ...data };
      localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    }
  },
  deleteAssignment: (id: string) => {
    const assignments = DataService.getAssignments().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  },
  getActiveAssignmentForVehicle: (vehicleId: string, date: Date): Assignment | undefined => {
      const assignments = DataService.getAssignments();
      const dateStr = date.toISOString().split('T')[0];
      return assignments
        .filter(a => a.vehicleId === vehicleId)
        .filter(a => a.startDate <= dateStr && (!a.endDate || a.endDate >= dateStr))
        .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  },
  getVehicleForDriver: (driverId: string, date: Date): string | undefined => {
      const assignments = DataService.getAssignments();
      const dateStr = date.toISOString().split('T')[0];
      const assign = assignments
        .filter(a => a.driverId === driverId)
        .filter(a => a.startDate <= dateStr && (!a.endDate || a.endDate >= dateStr))
        .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      return assign?.vehicleId;
  },
  getAssignmentDetailsForDriver: (driverId: string, date: Date): { vehicleId?: string, trailerId?: string } => {
      const assignments = DataService.getAssignments();
      const dateStr = date.toISOString().split('T')[0];
      const assign = assignments
        .filter(a => a.driverId === driverId)
        .filter(a => a.startDate <= dateStr && (!a.endDate || a.endDate >= dateStr))
        .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      
      return assign ? { vehicleId: assign.vehicleId, trailerId: assign.trailerId } : {};
  },

  // --- FUEL REQUESTS ---
  getFuelRequests: (): FuelRequest[] => {
    const data = localStorage.getItem(KEYS.FUEL_REQUESTS);
    return data ? JSON.parse(data) : [];
  },
  addFuelRequest: (req: Omit<FuelRequest, 'id' | 'status'>) => {
    const requests = DataService.getFuelRequests();
    const newReq: FuelRequest = {
      ...req,
      id: generateId(),
      status: 'PENDING'
    };
    requests.push(newReq);
    localStorage.setItem(KEYS.FUEL_REQUESTS, JSON.stringify(requests));
    return newReq;
  },
  approveFuelRequest: (id: string, approvalData: { gasStation?: string, isFullTank?: boolean, approvedCost?: number }) => {
    const requests = DataService.getFuelRequests();
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = 'APPROVED';
      req.approvedDate = new Date().toISOString();
      if (approvalData.gasStation) req.gasStation = approvalData.gasStation;
      if (approvalData.isFullTank !== undefined) req.isFullTank = approvalData.isFullTank;
      if (approvalData.approvedCost) req.approvedCost = approvalData.approvedCost;
      
      if (req.approvedCost) {
          const price = DataService.getPriceAtTime(req.approvedDate);
          if (price > 0) {
              req.approvedLitres = parseFloat((req.approvedCost / price).toFixed(2));
          }
      }

      if (req.isTemporary && req.approvedCost && req.approvedCost > 0) {
          DataService.addMoneyAdvance({
              driverId: req.driverId,
              amount: req.approvedCost,
              category: 'Dầu tạm',
              reason: `Phiếu dầu tạm ngày ${new Date(req.requestDate).toLocaleDateString('vi-VN')} (${req.id})`,
              date: req.requestDate
          }, 'APPROVED');
      }

      localStorage.setItem(KEYS.FUEL_REQUESTS, JSON.stringify(requests));
    }
  },
  rejectFuelRequest: (id: string) => {
    const requests = DataService.getFuelRequests();
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = 'REJECTED';
      localStorage.setItem(KEYS.FUEL_REQUESTS, JSON.stringify(requests));
    }
  },
  // UPDATED: Allow passing final data
  completeFuelRequest: (id: string, finalData?: { actualCost: number, actualLitres: number }) => {
    const requests = DataService.getFuelRequests();
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = 'COMPLETED';
      req.completedDate = new Date().toISOString();
      
      if (finalData) {
          req.actualCost = finalData.actualCost;
          req.actualLitres = finalData.actualLitres;
      } else {
          // Fallback if no actual data provided, use approved data
          req.actualCost = req.approvedCost;
          req.actualLitres = req.approvedLitres;
      }

      localStorage.setItem(KEYS.FUEL_REQUESTS, JSON.stringify(requests));
    }
  },
  revertFuelRequest: (id: string) => {
    const requests = DataService.getFuelRequests();
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = 'APPROVED';
      req.completedDate = undefined;
      req.actualCost = undefined;
      req.actualLitres = undefined;
      localStorage.setItem(KEYS.FUEL_REQUESTS, JSON.stringify(requests));
    }
  },
  updateFuelRequestData: (id: string, data: Partial<FuelRequest>) => {
    const requests = DataService.getFuelRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
       requests[index] = { ...requests[index], ...data };
       if (data.approvedCost) {
          const price = DataService.getPriceAtTime(requests[index].approvedDate || new Date().toISOString());
          if (price > 0) {
              requests[index].approvedLitres = parseFloat((data.approvedCost / price).toFixed(2));
          }
       }
       localStorage.setItem(KEYS.FUEL_REQUESTS, JSON.stringify(requests));
    }
  },

  // --- MONEY ADVANCES ---
  getMoneyAdvances: (): MoneyAdvance[] => {
    const data = localStorage.getItem(KEYS.MONEY_ADVANCES);
    return data ? JSON.parse(data) : [];
  },
  addMoneyAdvance: (adv: Omit<MoneyAdvance, 'id' | 'createdAt' | 'status'>, status: AdvanceStatus = 'PENDING') => {
    const advances = DataService.getMoneyAdvances();
    const newAdv: MoneyAdvance = {
      ...adv,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: status,
      approvedDate: status === 'APPROVED' ? new Date().toISOString() : undefined
    };
    advances.push(newAdv);
    localStorage.setItem(KEYS.MONEY_ADVANCES, JSON.stringify(advances));
  },
  approveMoneyAdvance: (id: string) => {
    const advances = DataService.getMoneyAdvances();
    const adv = advances.find(a => a.id === id);
    if (adv) {
      adv.status = 'APPROVED';
      adv.approvedDate = new Date().toISOString();
      localStorage.setItem(KEYS.MONEY_ADVANCES, JSON.stringify(advances));
    }
  },
  rejectMoneyAdvance: (id: string) => {
    const advances = DataService.getMoneyAdvances();
    const adv = advances.find(a => a.id === id);
    if (adv) {
      adv.status = 'REJECTED';
      localStorage.setItem(KEYS.MONEY_ADVANCES, JSON.stringify(advances));
    }
  },
  updateMoneyAdvance: (id: string, data: Partial<MoneyAdvance>) => {
      const advances = DataService.getMoneyAdvances();
      const idx = advances.findIndex(a => a.id === id);
      if (idx !== -1) {
          advances[idx] = { ...advances[idx], ...data };
          localStorage.setItem(KEYS.MONEY_ADVANCES, JSON.stringify(advances));
      }
  },

  // --- DRIVER EXPENSES ---
  getDriverExpenses: (): DriverExpense[] => {
    const data = localStorage.getItem(KEYS.DRIVER_EXPENSES);
    return data ? JSON.parse(data) : [];
  },
  addDriverExpense: (exp: Omit<DriverExpense, 'id' | 'createdAt' | 'status'>, status: ExpenseStatus = 'PENDING') => {
    const items = DataService.getDriverExpenses();
    const newItem: DriverExpense = {
      ...exp,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: status,
      approvedDate: status === 'APPROVED' ? new Date().toISOString() : undefined
    };
    items.push(newItem);
    localStorage.setItem(KEYS.DRIVER_EXPENSES, JSON.stringify(items));
  },
  approveDriverExpense: (id: string) => {
    const items = DataService.getDriverExpenses();
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = 'APPROVED';
      item.approvedDate = new Date().toISOString();
      localStorage.setItem(KEYS.DRIVER_EXPENSES, JSON.stringify(items));
    }
  },
  rejectDriverExpense: (id: string) => {
    const items = DataService.getDriverExpenses();
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = 'REJECTED';
      localStorage.setItem(KEYS.DRIVER_EXPENSES, JSON.stringify(items));
    }
  },
  updateDriverExpense: (id: string, data: Partial<DriverExpense>) => {
    const items = DataService.getDriverExpenses();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
        items[idx] = { ...items[idx], ...data };
        localStorage.setItem(KEYS.DRIVER_EXPENSES, JSON.stringify(items));
    }
  },

  // --- TIRE REPLACEMENTS ---
  getTireReplacements: (): TireReplacement[] => {
      const data = localStorage.getItem(KEYS.TIRE_REPLACEMENTS);
      return data ? JSON.parse(data) : [];
  },
  addTireReplacement: (item: Omit<TireReplacement, 'id' | 'createdAt'>) => {
      const items = DataService.getTireReplacements();
      items.push({
          ...item,
          id: generateId(),
          createdAt: new Date().toISOString()
      });
      localStorage.setItem(KEYS.TIRE_REPLACEMENTS, JSON.stringify(items));
  },
  deleteTireReplacement: (id: string) => {
      const items = DataService.getTireReplacements().filter(i => i.id !== id);
      localStorage.setItem(KEYS.TIRE_REPLACEMENTS, JSON.stringify(items));
  },

  // --- USERS ---
  getUsers: (): UserAccount[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  },
  saveUser: (user: UserAccount) => {
    const users = DataService.getUsers();
    if (user.id) {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) users[index] = user;
    } else {
      user.id = generateId();
      users.push(user);
    }
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
  deleteUser: (id: string) => {
    const users = DataService.getUsers().filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
  resetPassword: (id: string, newPass: string) => {
      const users = DataService.getUsers();
      const user = users.find(u => u.id === id);
      if (user) {
          user.password = newPass;
          localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      }
  },

  // --- DRIVER SALARIES ---
  getDriverSalaries: (): DriverSalary[] => {
      const data = localStorage.getItem(KEYS.DRIVER_SALARIES);
      return data ? JSON.parse(data) : [];
  },
  addDriverSalariesBulk: (salaries: Omit<DriverSalary, 'id' | 'createdAt'>[]) => {
      const currentSalaries = DataService.getDriverSalaries();
      const newSalaries = salaries.map(s => ({
          ...s,
          id: generateId(),
          createdAt: new Date().toISOString()
      }));
      const updated = [...currentSalaries, ...newSalaries];
      localStorage.setItem(KEYS.DRIVER_SALARIES, JSON.stringify(updated));
  },
  deleteDriverSalary: (id: string) => {
      const items = DataService.getDriverSalaries().filter(i => i.id !== id);
      localStorage.setItem(KEYS.DRIVER_SALARIES, JSON.stringify(items));
  },

  // --- PAY ON BEHALF (ORIGINAL) ---
  getPayOnBehalf: (): PayOnBehalf[] => {
    const data = localStorage.getItem(KEYS.PAY_ON_BEHALF);
    return data ? JSON.parse(data) : [];
  },
  addPayOnBehalfBulk: (itemsData: Omit<PayOnBehalf, 'id' | 'createdAt'>[]) => {
    const currentItems = DataService.getPayOnBehalf();
    const newItems = itemsData.map(s => ({
      ...s,
      id: generateId(),
      createdAt: new Date().toISOString(),
      hasSlipGenerated: false
    }));
    const updated = [...currentItems, ...newItems];
    localStorage.setItem(KEYS.PAY_ON_BEHALF, JSON.stringify(updated));
  },
  updatePayOnBehalf: (id: string, data: Partial<PayOnBehalf>) => {
    const items = DataService.getPayOnBehalf();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
        items[index] = { ...items[index], ...data };
        localStorage.setItem(KEYS.PAY_ON_BEHALF, JSON.stringify(items));
    }
  },
  deletePayOnBehalf: (id: string) => {
    const items = DataService.getPayOnBehalf().filter(i => i.id !== id);
    localStorage.setItem(KEYS.PAY_ON_BEHALF, JSON.stringify(items));
  },

  // --- PAY ON BEHALF SLIPS (NEW SEPARATE TABLE) ---
  getPayOnBehalfSlips: (): PayOnBehalfSlip[] => {
    const data = localStorage.getItem(KEYS.PAY_ON_BEHALF_SLIPS);
    return data ? JSON.parse(data) : [];
  },
  createPayOnBehalfSlips: (slips: Omit<PayOnBehalfSlip, 'id' | 'createdAt'>[]) => {
    const currentSlips = DataService.getPayOnBehalfSlips();
    const newSlips = slips.map(s => ({
      ...s,
      id: generateId(),
      createdAt: new Date().toISOString()
    }));
    
    // Save new slips
    localStorage.setItem(KEYS.PAY_ON_BEHALF_SLIPS, JSON.stringify([...currentSlips, ...newSlips]));

    // Mark original items as generated
    const originalIds = [...new Set(slips.map(s => s.refId).filter(Boolean))];
    const originalItems = DataService.getPayOnBehalf();
    let originalChanged = false;
    
    originalItems.forEach(item => {
      if (originalIds.includes(item.id)) {
        item.hasSlipGenerated = true;
        originalChanged = true;
      }
    });

    if (originalChanged) {
      localStorage.setItem(KEYS.PAY_ON_BEHALF, JSON.stringify(originalItems));
    }
  },
  deletePayOnBehalfSlip: (id: string) => {
    const items = DataService.getPayOnBehalfSlips().filter(i => i.id !== id);
    localStorage.setItem(KEYS.PAY_ON_BEHALF_SLIPS, JSON.stringify(items));
  },

  // --- REFUND ENTRIES (NEW) ---
  getRefundEntries: (): RefundEntry[] => {
    const data = localStorage.getItem(KEYS.REFUND_ENTRIES);
    return data ? JSON.parse(data) : [];
  },
  saveRefundEntry: (entry: RefundEntry) => {
    const items = DataService.getRefundEntries();
    // Key is containerNo. If exists, update; else push.
    const index = items.findIndex(i => i.containerNo === entry.containerNo);
    if (index !== -1) {
      items[index] = { ...items[index], ...entry, updatedAt: new Date().toISOString() };
    } else {
      items.push({ ...entry, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(KEYS.REFUND_ENTRIES, JSON.stringify(items));
  },

  // --- PAYMENT RECIPIENTS ---
  getPaymentRecipients: (): PaymentRecipient[] => {
    const data = localStorage.getItem(KEYS.PAYMENT_RECIPIENTS);
    return data ? JSON.parse(data) : INITIAL_RECIPIENTS;
  },
  addPaymentRecipient: (recipient: Omit<PaymentRecipient, 'id'>) => {
    const items = DataService.getPaymentRecipients();
    const newItem: PaymentRecipient = {
      ...recipient,
      id: generateId()
    };
    items.push(newItem);
    localStorage.setItem(KEYS.PAYMENT_RECIPIENTS, JSON.stringify(items));
  },
  addPaymentRecipientsBulk: (recipients: Omit<PaymentRecipient, 'id'>[]) => {
    const items = DataService.getPaymentRecipients();
    const newItems = recipients.map(r => ({
      ...r,
      id: generateId()
    }));
    const updated = [...items, ...newItems];
    localStorage.setItem(KEYS.PAYMENT_RECIPIENTS, JSON.stringify(updated));
  },
  deletePaymentRecipient: (id: string) => {
    const items = DataService.getPaymentRecipients().filter(i => i.id !== id);
    localStorage.setItem(KEYS.PAYMENT_RECIPIENTS, JSON.stringify(items));
  },

  // --- PAY ON BEHALF REASONS ---
  getPayOnBehalfReasons: (): PayOnBehalfReason[] => {
    const data = localStorage.getItem(KEYS.PAY_ON_BEHALF_REASONS);
    return data ? JSON.parse(data) : INITIAL_POB_REASONS;
  },
  addPayOnBehalfReason: (reason: Omit<PayOnBehalfReason, 'id'>) => {
    const items = DataService.getPayOnBehalfReasons();
    items.push({ ...reason, id: generateId() });
    localStorage.setItem(KEYS.PAY_ON_BEHALF_REASONS, JSON.stringify(items));
  },
  deletePayOnBehalfReason: (id: string) => {
    const items = DataService.getPayOnBehalfReasons().filter(i => i.id !== id);
    localStorage.setItem(KEYS.PAY_ON_BEHALF_REASONS, JSON.stringify(items));
  },

  // --- DAILY ODOMETERS ---
  getDailyOdometers: (): DailyOdometer[] => {
      const data = localStorage.getItem(KEYS.DAILY_ODOMETERS);
      return data ? JSON.parse(data) : [];
  },
  addDailyOdometer: (odo: Omit<DailyOdometer, 'id' | 'createdAt'>) => {
      const items = DataService.getDailyOdometers();
      items.push({
          ...odo,
          id: generateId(),
          createdAt: new Date().toISOString()
      });
      localStorage.setItem(KEYS.DAILY_ODOMETERS, JSON.stringify(items));
  },
  calculateVehicleOdometer: (vehicleId: string): number => {
      const v = DataService.getVehicles().find(veh => veh.id === vehicleId);
      if (!v) return 0;
      const initial = v.initialOdometer || 0;
      const dailyOdos = DataService.getDailyOdometers().filter(o => o.vehicleId === vehicleId);
      const travelled = dailyOdos.reduce((sum, o) => sum + o.distance, 0);
      return initial + travelled;
  },

  // --- CONFIG: FUEL PRICES ---
  getFuelPrices: (): FuelPrice[] => {
    const data = localStorage.getItem(KEYS.FUEL_PRICES);
    return data ? JSON.parse(data) : INITIAL_PRICES;
  },
  addFuelPrice: (price: Omit<FuelPrice, 'id'>) => {
    const items = DataService.getFuelPrices();
    items.push({ ...price, id: generateId() });
    localStorage.setItem(KEYS.FUEL_PRICES, JSON.stringify(items));
  },
  getPriceAtTime: (dateIso: string): number => {
    const prices = DataService.getFuelPrices().sort((a,b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    const price = prices.find(p => p.effectiveDate <= dateIso);
    return price ? price.price : (prices[0]?.price || 0);
  },

  // --- CONFIG: GAS STATIONS ---
  getGasStations: (): GasStation[] => {
    const data = localStorage.getItem(KEYS.GAS_STATIONS);
    return data ? JSON.parse(data) : INITIAL_STATIONS;
  },
  addGasStation: (station: Omit<GasStation, 'id'>) => {
    const items = DataService.getGasStations();
    items.push({ ...station, id: generateId() });
    localStorage.setItem(KEYS.GAS_STATIONS, JSON.stringify(items));
  },
  deleteGasStation: (id: string) => {
    const items = DataService.getGasStations().filter(i => i.id !== id);
    localStorage.setItem(KEYS.GAS_STATIONS, JSON.stringify(items));
  },
  setGasStationDefault: (id: string) => {
      const items = DataService.getGasStations();
      items.forEach(s => s.isDefault = (s.id === id));
      localStorage.setItem(KEYS.GAS_STATIONS, JSON.stringify(items));
  },

  // --- CONFIG: EXPENSE CATEGORIES ---
  getExpenseCategories: (): ExpenseCategory[] => {
    const data = localStorage.getItem(KEYS.EXPENSE_CATEGORIES);
    return data ? JSON.parse(data) : INITIAL_CATEGORIES;
  },
  addExpenseCategory: (cat: Omit<ExpenseCategory, 'id'>) => {
    const items = DataService.getExpenseCategories();
    items.push({ ...cat, id: generateId() });
    localStorage.setItem(KEYS.EXPENSE_CATEGORIES, JSON.stringify(items));
  },
  deleteExpenseCategory: (id: string) => {
    const items = DataService.getExpenseCategories().filter(i => i.id !== id);
    localStorage.setItem(KEYS.EXPENSE_CATEGORIES, JSON.stringify(items));
  },

  // --- ANNOUNCEMENTS ---
  getAnnouncements: (): Announcement[] => {
    const data = localStorage.getItem(KEYS.ANNOUNCEMENTS);
    return data ? JSON.parse(data) : [];
  },
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    const items = DataService.getAnnouncements();
    const newItem = {
      ...announcement,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(items));
  },
  deleteAnnouncement: (id: string) => {
    const items = DataService.getAnnouncements().filter(i => i.id !== id);
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(items));
  },
  
  // --- READ RECEIPTS ---
  getReadReceipts: (): ReadReceipt[] => {
    const data = localStorage.getItem(KEYS.READ_RECEIPTS);
    return data ? JSON.parse(data) : [];
  },
  markAnnouncementAsRead: (announcementId: string, userId: string) => {
    const receipts = DataService.getReadReceipts();
    if (!receipts.some(r => r.announcementId === announcementId && r.userId === userId)) {
      receipts.push({
        announcementId,
        userId,
        readAt: new Date().toISOString()
      });
      localStorage.setItem(KEYS.READ_RECEIPTS, JSON.stringify(receipts));
    }
  }
};
