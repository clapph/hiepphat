
import React, { useEffect, useState } from 'react';
import { Truck, Fuel, Users, CalendarClock, AlertCircle, Calendar, CreditCard, AlertTriangle, CheckCircle, Search, ArrowRight, Wallet, Receipt, Disc, Gauge, Wrench, ChevronRight, Activity, DollarSign, TrendingUp, Bell, Layers } from 'lucide-react';
import { Role, Driver, Vehicle, TireReplacement, DriverSalary, Announcement, PayOnBehalfSlip, RefundEntry } from '../types';
import { DataService } from '../services/dataService';

interface DashboardProps {
  role: Role;
  onChangePage: (page: any) => void;
}

// --- COMPONENTS FOR NEW DESIGN ---

const ActionCard = ({ title, count, icon: Icon, colorFrom, colorTo, onClick, label }: any) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${colorFrom} ${colorTo}`}
  >
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-white/90 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-4xl font-bold">{count}</h3>
        <p className="text-xs text-white/80 mt-2 font-medium bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm flex items-center">
          {label} <ChevronRight size={12} className="ml-1" />
        </p>
      </div>
      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  </div>
);

const InfoCard = ({ title, value, subtext, icon: Icon, iconColor, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex items-center"
  >
    <div className={`p-3 rounded-xl ${iconColor} mr-4`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {subtext && <span className="text-xs text-gray-400 font-medium">{subtext}</span>}
      </div>
    </div>
  </div>
);

const ListItem = ({ title, subTitle, rightText, statusColor, icon: Icon }: any) => (
  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${statusColor ? statusColor : 'bg-gray-100 text-gray-500'}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{subTitle}</p>
      </div>
    </div>
    <div className="text-right">
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>
        {rightText}
      </span>
    </div>
  </div>
);

// --- MAIN DASHBOARD COMPONENT ---

const Dashboard: React.FC<DashboardProps> = ({ role, onChangePage }) => {
  // Admin Stats
  const [stats, setStats] = useState({
    drivers: 0,
    vehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    pendingFuel: 0,
    pendingAdvances: 0,
    pendingExpenses: 0,
    activeAssignments: 0
  });
  
  // Financial Stats (Admin)
  const [financialStats, setFinancialStats] = useState({
      totalSalaryThisMonth: 0,
      totalHandlingThisMonth: 0,
      totalPobThisMonth: 0,
      totalRefundThisMonth: 0,
      totalAdvanceThisMonth: 0
  });

  // Admin List Data for Expiry Tracking
  const [adminLists, setAdminLists] = useState<{
    drivers: Driver[];
    vehicles: Vehicle[];
    recentTires: TireReplacement[];
  }>({
    drivers: [],
    vehicles: [],
    recentTires: []
  });

  // Driver Specific Data
  const [driverData, setDriverData] = useState<{
    info: Driver | null;
    currentVehicle: Vehicle | null;
    currentOdo: number;
    todayStr: string;
    salaryThisMonth: number;
    handlingThisMonth: number;
    tripsThisMonth: number;
  }>({
    info: null,
    currentVehicle: null,
    currentOdo: 0,
    todayStr: '',
    salaryThisMonth: 0,
    handlingThisMonth: 0,
    tripsThisMonth: 0
  });

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load common data
    const drivers = DataService.getDrivers();
    const vehicles = DataService.getVehicles();
    const fuel = DataService.getFuelRequests();
    const advances = DataService.getMoneyAdvances();
    const expenses = DataService.getDriverExpenses();
    const tires = DataService.getTireReplacements();
    const assignments = DataService.getAssignments();
    const salaries = DataService.getDriverSalaries();
    const pobSlips = DataService.getPayOnBehalfSlips();
    const refundEntries = DataService.getRefundEntries();
    
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const currentMonthPrefix = todayISO.slice(0, 7); // YYYY-MM
    const activeAssigns = assignments.filter(a => !a.endDate || a.endDate >= todayISO).length;

    // Admin Stats Logic
    if (role === 'ADMIN') {
        setStats({
            drivers: drivers.length,
            vehicles: vehicles.length,
            activeVehicles: vehicles.filter(v => v.status === 'active').length,
            maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
            pendingFuel: fuel.filter(f => f.status === 'PENDING').length,
            pendingAdvances: advances.filter(a => a.status === 'PENDING').length,
            pendingExpenses: expenses.filter(e => e.status === 'PENDING').length,
            activeAssignments: activeAssigns
        });

        // Financials (Current Month)
        const currentSalaries = salaries.filter(s => s.date.startsWith(currentMonthPrefix));
        const totalSal = currentSalaries.reduce((sum, s) => sum + s.tripSalary, 0);
        const totalHand = currentSalaries.reduce((sum, s) => sum + s.handlingFee, 0);

        const currentPob = pobSlips.filter(s => s.date.startsWith(currentMonthPrefix));
        const totalPob = currentPob.reduce((sum, s) => sum + s.amount, 0);

        const currentRefunds = refundEntries.filter(r => r.refundDate && r.refundDate.startsWith(currentMonthPrefix));
        const totalRefund = currentRefunds.reduce((sum, r) => sum + r.refundAmount, 0);

        const currentAdvances = advances.filter(a => 
            a.date.startsWith(currentMonthPrefix) && a.status === 'APPROVED'
        );
        const totalAdvance = currentAdvances.reduce((sum, a) => sum + a.amount, 0);

        setFinancialStats({
            totalSalaryThisMonth: totalSal,
            totalHandlingThisMonth: totalHand,
            totalPobThisMonth: totalPob,
            totalRefundThisMonth: totalRefund,
            totalAdvanceThisMonth: totalAdvance
        });
        
        // Sort for Admin Lists (Approaching Expiry First)
        const sortedDrivers = [...drivers].sort((a, b) => {
           if (!a.licenseExpiry) return 1;
           if (!b.licenseExpiry) return -1;
           return new Date(a.licenseExpiry).getTime() - new Date(b.licenseExpiry).getTime();
        });

        const sortedVehicles = [...vehicles].sort((a, b) => {
           if (!a.registrationExpiry) return 1;
           if (!b.registrationExpiry) return -1;
           return new Date(a.registrationExpiry).getTime() - new Date(b.registrationExpiry).getTime();
        });

        // Get 5 most recent tire changes
        const sortedTires = [...tires].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 5);

        setAdminLists({
          drivers: sortedDrivers.slice(0, 6), // Top 6
          vehicles: sortedVehicles.slice(0, 6), // Top 6
          recentTires: sortedTires
        });
    }

    // Driver Specific Logic (Simulating logged in user 'd1')
    if (role === 'DRIVER') {
      const currentDriverId = 'd1'; // Mock ID
      const myInfo = drivers.find(d => d.id === currentDriverId) || null;
      
      const vehicleId = DataService.getVehicleForDriver(currentDriverId, today);
      const myVehicle = vehicleId ? vehicles.find(v => v.id === vehicleId) || null : null;
      const curOdo = vehicleId ? DataService.calculateVehicleOdometer(vehicleId) : 0;

      // Salary Stats for Driver
      // Note: DataService.getDriverSalaries stores 'driverName', not ID. We match by Name for this demo.
      const mySalaries = salaries.filter(s => 
          s.driverName === myInfo?.name && s.date.startsWith(currentMonthPrefix)
      );
      const salTotal = mySalaries.reduce((sum, s) => sum + s.tripSalary, 0);
      const handTotal = mySalaries.reduce((sum, s) => sum + s.handlingFee, 0);

      // Format Date
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[today.getDay()];
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${dayName}, ${day}/${month}/${year}`;

      setDriverData({
        info: myInfo,
        currentVehicle: myVehicle,
        currentOdo: curOdo,
        todayStr: formattedDate,
        salaryThisMonth: salTotal,
        handlingThisMonth: handTotal,
        tripsThisMonth: mySalaries.length
      });

      // Load Announcements for Driver
      const allAnnouncements = DataService.getAnnouncements();
      const readReceipts = DataService.getReadReceipts();
      
      // Filter: Only show active announcements (by date)
      // Logic update: Show ALL valid announcements, regardless of read status
      const validAnnouncements = allAnnouncements.filter(a => {
        return new Date(a.validUntil) >= new Date(todayISO);
      });
      setAnnouncements(validAnnouncements);

      // Store read IDs for UI check
      const myReadIds = new Set(
        readReceipts
          .filter(r => r.userId === currentDriverId)
          .map(r => r.announcementId)
      );
      setReadIds(myReadIds);
    }

  }, [role]);

  // Helper to calculate status color
  const getExpiryStyle = (dateStr?: string) => {
    if (!dateStr) return { color: 'bg-gray-100 text-gray-500', text: 'Chưa có dữ liệu', icon: AlertCircle };
    
    const expiry = new Date(dateStr);
    const now = new Date();
    expiry.setHours(23, 59, 59, 999);
    now.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'bg-red-100 text-red-600', text: `Quá hạn ${Math.abs(diffDays)} ngày`, icon: AlertCircle };
    if (diffDays <= 30) return { color: 'bg-orange-100 text-orange-600', text: `Còn ${diffDays} ngày`, icon: AlertTriangle };
    return { color: 'bg-green-100 text-green-600', text: `Còn ${diffDays} ngày`, icon: CheckCircle };
  };

  const handleMarkAsRead = (id: string) => {
    const currentDriverId = 'd1'; // Mock ID
    DataService.markAnnouncementAsRead(id, currentDriverId);
    // Update local state to visually mark as read without removing it
    setReadIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">
          {role === 'ADMIN' ? 'Tổng quan vận hành' : 'Bảng tin tài xế'}
        </h2>
        {role === 'DRIVER' ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between mt-2">
            <div>
              <p className="text-gray-600">
                Chào mừng, <span className="font-bold text-primary">{driverData.info?.name}</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-1 bg-white px-2 py-1 rounded w-fit border">
                <Calendar size={12} className="mr-1" /> {driverData.todayStr}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mt-1">Xin chào Admin, đây là tình hình hoạt động hôm nay.</p>
        )}
      </header>

      {/* ANNOUNCEMENTS SECTION (DRIVER ONLY) */}
      {role === 'DRIVER' && announcements.length > 0 && (
        <div className="space-y-4">
           {announcements.map(ann => {
             const isRead = readIds.has(ann.id);
             return (
               <div key={ann.id} className={`p-4 rounded-xl border flex items-start gap-4 shadow-sm animate-fade-in transition-colors ${
                   isRead ? 'bg-gray-50 border-gray-200 opacity-75' : (ann.priority === 'high' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100')
                 }`}>
                  <div className={`p-2 rounded-full ${
                      isRead ? 'bg-gray-200 text-gray-500' : (ann.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')
                    }`}>
                     <Bell size={20} />
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-lg ${isRead ? 'text-gray-600' : (ann.priority === 'high' ? 'text-red-800' : 'text-blue-800')}`}>{ann.title}</h4>
                        {ann.priority === 'high' && !isRead && <span className="text-[10px] font-bold uppercase bg-red-200 text-red-800 px-2 py-0.5 rounded">Quan trọng</span>}
                     </div>
                     <p className={`text-sm mt-1 whitespace-pre-wrap ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>{ann.content}</p>
                     <p className="text-xs text-gray-400 mt-2">Ngày đăng: {new Date(ann.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  {isRead ? (
                      <span className="px-3 py-1.5 text-green-600 text-xs font-bold flex items-center bg-green-50 rounded-lg border border-green-100">
                          <CheckCircle size={14} className="mr-1" /> Đã xem
                      </span>
                  ) : (
                      <button 
                        onClick={() => handleMarkAsRead(ann.id)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 shadow-sm whitespace-nowrap"
                      >
                        Đã xem
                      </button>
                  )}
               </div>
             );
           })}
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {role === 'ADMIN' && (
        <div className="space-y-8">
          
          {/* SECTION 1: ACTION REQUIRED (KPIs) */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <AlertCircle size={16} className="mr-2" /> Cần xử lý ngay
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ActionCard 
                title="Đơn dầu chờ duyệt"
                count={stats.pendingFuel}
                icon={Fuel}
                colorFrom="from-orange-400"
                colorTo="to-orange-600"
                label="Xem danh sách"
                onClick={() => onChangePage('fuel')}
              />
              <ActionCard 
                title="Tạm ứng chờ duyệt"
                count={stats.pendingAdvances}
                icon={Wallet}
                colorFrom="from-purple-500"
                colorTo="from-purple-600 to-indigo-600"
                label="Xem yêu cầu"
                onClick={() => onChangePage('advances')}
              />
              <ActionCard 
                title="Chi phí chờ duyệt"
                count={stats.pendingExpenses}
                icon={Receipt}
                colorFrom="from-rose-500"
                colorTo="to-red-600"
                label="Cần phê duyệt"
                onClick={() => onChangePage('expenses')}
              />
            </div>
          </div>

          {/* SECTION 2: OPERATIONAL STATUS */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <Truck size={16} className="mr-2" /> Nhân sự & Phương tiện
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <InfoCard 
                title="Xe đang hoạt động"
                value={stats.activeAssignments}
                subtext={`/ ${stats.activeVehicles} xe sẵn sàng`}
                icon={Truck}
                iconColor="bg-blue-100 text-blue-600"
                onClick={() => onChangePage('assignments')}
              />
              <InfoCard 
                title="Tổng số Tài xế"
                value={stats.drivers}
                subtext="nhân sự"
                icon={Users}
                iconColor="bg-teal-100 text-teal-600"
                onClick={() => onChangePage('resources')}
              />
            </div>
          </div>

          {/* SECTION 3: FINANCIAL STATUS */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <Activity size={16} className="mr-2" /> Tài chính (Tháng {new Date().getMonth() + 1})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <InfoCard 
                title="Lương Chuyến (Tháng)"
                value={`${(financialStats.totalSalaryThisMonth / 1000000).toFixed(1)}M`}
                subtext="VNĐ ước tính"
                icon={DollarSign}
                iconColor="bg-green-100 text-green-600"
                onClick={() => onChangePage('salary')}
              />
              <InfoCard 
                title="Tiền Làm Hàng (Tháng)"
                value={`${(financialStats.totalHandlingThisMonth / 1000000).toFixed(1)}M`}
                subtext="VNĐ phát sinh"
                icon={TrendingUp}
                iconColor="bg-orange-100 text-orange-600"
                onClick={() => onChangePage('salary')}
              />
              <InfoCard 
                title="Tiền Chi Hộ (Tháng)"
                value={`${(financialStats.totalPobThisMonth / 1000000).toFixed(1)}M`}
                subtext="VNĐ đã chi"
                icon={CreditCard}
                iconColor="bg-cyan-100 text-cyan-600"
                onClick={() => onChangePage('pay-on-behalf')}
              />
              <InfoCard 
                title="Tạm Ứng (Tháng)"
                value={`${(financialStats.totalAdvanceThisMonth / 1000000).toFixed(1)}M`}
                subtext="VNĐ đã duyệt"
                icon={Wallet}
                iconColor="bg-indigo-100 text-indigo-600"
                onClick={() => onChangePage('advances')}
              />
              <InfoCard 
                title="Tiền Hoàn Ứng (Tháng)"
                value={`${(financialStats.totalRefundThisMonth / 1000000).toFixed(1)}M`}
                subtext="VNĐ thu về"
                icon={Layers}
                iconColor="bg-purple-100 text-purple-600"
                onClick={() => onChangePage('refund-management')}
              />
            </div>
          </div>

          {/* SECTION 4: TRACKING LISTS */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            
            {/* Vehicle Registration Expiry */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[420px]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800 flex items-center">
                   <Truck className="mr-2 text-blue-600" size={18} />
                   Hạn Đăng kiểm Xe
                 </h3>
                 <button onClick={() => onChangePage('resources')} className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Xem tất cả</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {adminLists.vehicles.length === 0 ? <p className="text-center text-gray-400 py-10">Tất cả đều ổn định</p> : 
                  adminLists.vehicles.map(v => {
                    const st = getExpiryStyle(v.registrationExpiry);
                    const StatusIcon = st.icon;
                    return (
                      <ListItem 
                        key={v.id}
                        title={v.plateNumber}
                        subTitle={v.type}
                        rightText={st.text}
                        statusColor={st.color}
                        icon={StatusIcon}
                      />
                    );
                  })
                }
              </div>
            </div>

            {/* Driver License Expiry */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[420px]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800 flex items-center">
                   <CreditCard className="mr-2 text-purple-600" size={18} />
                   Hạn Bằng lái Tài xế
                 </h3>
                 <button onClick={() => onChangePage('resources')} className="text-xs font-semibold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded">Xem tất cả</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {adminLists.drivers.length === 0 ? <p className="text-center text-gray-400 py-10">Tất cả đều ổn định</p> : 
                  adminLists.drivers.map(d => {
                    const st = getExpiryStyle(d.licenseExpiry);
                    const StatusIcon = st.icon;
                    return (
                      <ListItem 
                        key={d.id}
                        title={d.name}
                        subTitle={d.phone}
                        rightText={st.text}
                        statusColor={st.color}
                        icon={StatusIcon}
                      />
                    );
                  })
                }
              </div>
            </div>

            {/* Recent Tire Changes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[420px]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800 flex items-center">
                   <Disc className="mr-2 text-slate-700" size={18} />
                   Thay vỏ gần đây
                 </h3>
                 <button onClick={() => onChangePage('tires')} className="text-xs font-semibold text-slate-600 hover:bg-slate-50 px-2 py-1 rounded">Xem tất cả</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {adminLists.recentTires.length === 0 ? <p className="text-center text-gray-400 py-10">Chưa có dữ liệu</p> : 
                  adminLists.recentTires.map(t => {
                    const v = adminLists.vehicles.find(veh => veh.id === t.vehicleId);
                    return (
                      <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex flex-col items-center min-w-[50px]">
                             <span>{new Date(t.date).getDate()}</span>
                             <span className="text-[10px] font-normal">Thg {new Date(t.date).getMonth() + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{v?.plateNumber}</p>
                            <p className="text-xs text-gray-500 truncate w-32">VT: {t.positions.join(', ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-red-600 block">
                            {t.cost.toLocaleString()} đ
                          </span>
                          <span className="text-[10px] text-gray-400">{t.brand}</span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DRIVER DASHBOARD (Kept functional but clean) */}
      {role === 'DRIVER' && (
        <div className="space-y-6">
          
          {/* Salary Summary Card for Driver */}
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-left"></div>
              <div className="relative z-10 flex justify-between items-center">
                  <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Thu nhập ước tính (Tháng {new Date().getMonth() + 1})</p>
                      <h3 className="text-3xl font-bold">{(driverData.salaryThisMonth + driverData.handlingThisMonth).toLocaleString()} đ</h3>
                      <div className="flex gap-4 mt-3 text-xs text-white/90">
                          <span>Lương: {driverData.salaryThisMonth.toLocaleString()} đ</span>
                          <span className="w-[1px] bg-white/40 h-3 self-center"></span>
                          <span>Làm hàng: {driverData.handlingThisMonth.toLocaleString()} đ</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="bg-white/20 p-3 rounded-xl inline-block mb-2">
                          <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-bold">{driverData.tripsThisMonth} chuyến</p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
               <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center space-x-3">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                     <CreditCard size={24} />
                   </div>
                   <div>
                     <p className="text-sm text-gray-500 font-medium">Giấy phép lái xe</p>
                     <p className="font-bold text-gray-800 text-xl">{driverData.info?.licenseNumber || '---'}</p>
                   </div>
                 </div>
               </div>
               <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                  <span className="text-gray-500 text-sm">Hết hạn: <span className="font-medium text-gray-800">{driverData.info?.licenseExpiry ? new Date(driverData.info.licenseExpiry).toLocaleDateString('vi-VN') : '--'}</span></span>
                  {(() => {
                    const st = getExpiryStyle(driverData.info?.licenseExpiry);
                    return <span className={`text-xs font-bold px-2 py-1 rounded-lg ${st.color}`}>{st.text}</span>
                  })()}
               </div>
            </div>

            {/* Vehicle */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
               <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center space-x-3">
                   <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                     <Truck size={24} />
                   </div>
                   <div>
                     <p className="text-sm text-gray-500 font-medium">Xe đang vận hành</p>
                     <p className="font-bold text-gray-800 text-xl">{driverData.currentVehicle?.plateNumber || 'Chưa phân công'}</p>
                   </div>
                 </div>
               </div>
               <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                  {driverData.currentVehicle ? (
                    <>
                      <span className="text-gray-500 text-sm flex items-center"><Gauge size={14} className="mr-1"/> ODO: <span className="font-medium text-gray-800 ml-1">{driverData.currentOdo.toLocaleString()}</span></span>
                      {(() => {
                        const st = getExpiryStyle(driverData.currentVehicle?.registrationExpiry);
                        return <span className={`text-xs font-bold px-2 py-1 rounded-lg ${st.color}`}>ĐK: {st.text}</span>
                      })()}
                    </>
                  ) : <span className="text-gray-400 text-sm">Vui lòng kiểm tra phân công</span>}
               </div>
            </div>
          </div>

          <h3 className="font-bold text-gray-700 mt-4">Truy cập nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { id: 'fuel', label: 'Đổ dầu', icon: Fuel, color: 'bg-orange-50 text-orange-600 border-orange-100' },
               { id: 'expenses', label: 'Báo chi phí', icon: Receipt, color: 'bg-red-50 text-red-600 border-red-100' },
               { id: 'salary', label: 'Xem Lương', icon: DollarSign, color: 'bg-green-50 text-green-600 border-green-100' },
               { id: 'reports', label: 'Lịch sử', icon: CalendarClock, color: 'bg-blue-50 text-blue-600 border-blue-100' },
             ].map((item: any) => (
               <button 
                  key={item.id}
                  onClick={() => onChangePage(item.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border hover:shadow-md transition-all group ${item.color}`}
               >
                  <item.icon size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">{item.label}</span>
               </button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
