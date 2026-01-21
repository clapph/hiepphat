
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Calendar, Filter, Fuel, Wallet, Receipt, DollarSign, TrendingUp, CreditCard, Clock, Truck, Layers, Container, Download, FileCheck, AlertCircle, CheckCircle2, User, Droplet } from 'lucide-react';
import { Role, FuelRequest, DriverExpense, MoneyAdvance, DriverSalary, PayOnBehalfSlip, RefundEntry, Vehicle } from '../types';
import { DataService } from '../services/dataService';
import * as XLSX from 'xlsx';

interface ReportsProps {
  role: Role;
}

const Reports: React.FC<ReportsProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses' | 'advances' | 'salary' | 'pob' | 'refunds'>('fuel');
  const [pobReasons, setPobReasons] = useState<any[]>([]); 
  
  // Data states
  const [fuelRequests, setFuelRequests] = useState<FuelRequest[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [advances, setAdvances] = useState<MoneyAdvance[]>([]);
  const [salaries, setSalaries] = useState<DriverSalary[]>([]);
  const [pobSlips, setPobSlips] = useState<PayOnBehalfSlip[]>([]);
  const [refundEntries, setRefundEntries] = useState<RefundEntry[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Mock Current User for Driver Role
  const currentDriverId = 'd1';
  // Note: Name will be resolved from drivers list for consistency
  const currentDriverName = drivers.find(d => d.id === currentDriverId)?.name || 'Tài xế';

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Color Palette for Driver Cards (Distinct colors loop)
  const DRIVER_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', sub: 'text-blue-700', badge: 'bg-white text-blue-700 border-blue-200' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', sub: 'text-emerald-700', badge: 'bg-white text-emerald-700 border-emerald-200' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', sub: 'text-purple-700', badge: 'bg-white text-purple-700 border-purple-200' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', sub: 'text-orange-700', badge: 'bg-white text-orange-700 border-orange-200' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', sub: 'text-rose-700', badge: 'bg-white text-rose-700 border-rose-200' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', sub: 'text-cyan-700', badge: 'bg-white text-cyan-700 border-cyan-200' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', sub: 'text-indigo-700', badge: 'bg-white text-indigo-700 border-indigo-200' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', sub: 'text-teal-700', badge: 'bg-white text-teal-700 border-teal-200' },
  ];

  useEffect(() => {
    setFuelRequests(DataService.getFuelRequests());
    setExpenses(DataService.getDriverExpenses());
    setAdvances(DataService.getMoneyAdvances());
    setSalaries(DataService.getDriverSalaries());
    setPobSlips(DataService.getPayOnBehalfSlips());
    setPobReasons(DataService.getPayOnBehalfReasons());
    setRefundEntries(DataService.getRefundEntries());
    setDrivers(DataService.getDrivers());
    setVehicles(DataService.getVehicles());
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Helper for Status Localization
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        'PENDING': 'bg-orange-100 text-orange-700 border-orange-200',
        'APPROVED': 'bg-blue-100 text-blue-700 border-blue-200',
        'REJECTED': 'bg-red-100 text-red-700 border-red-200',
        'COMPLETED': 'bg-green-100 text-green-700 border-green-200'
    };
    const labels: Record<string, string> = {
        'PENDING': 'Chờ duyệt',
        'APPROVED': 'Đã duyệt',
        'REJECTED': 'Từ chối',
        'COMPLETED': 'Hoàn tất'
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
            {labels[status] || status}
        </span>
    );
  };

  const filterData = (data: any[], dateField: string) => {
    return data.filter(item => {
      const itemDate = item[dateField]?.split('T')[0];
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // --- FILTERING LOGIC WITH ROLE CHECK ---

  const filteredFuel = useMemo(() => {
    let data = filterData(fuelRequests, 'requestDate');
    if (role === 'DRIVER') {
        data = data.filter(f => f.driverId === currentDriverId);
    }
    return data;
  }, [fuelRequests, startDate, endDate, role]);

  const filteredExpenses = useMemo(() => {
    let data = filterData(expenses, 'date');
    if (role === 'DRIVER') {
        data = data.filter(e => e.driverId === currentDriverId);
    }
    return data;
  }, [expenses, startDate, endDate, role]);

  const filteredAdvances = useMemo(() => {
    let data = filterData(advances, 'date');
    if (role === 'DRIVER') {
        data = data.filter(a => a.driverId === currentDriverId);
    }
    return data;
  }, [advances, startDate, endDate, role]);

  const filteredSalaries = useMemo(() => {
    let data = filterData(salaries, 'date');
    if (role === 'DRIVER') {
        // Driver names in Salary table might be strings, try to match robustly or use ID if available in future
        data = data.filter(s => s.driverName.toLowerCase() === currentDriverName.toLowerCase());
    }
    return data;
  }, [salaries, startDate, endDate, role, currentDriverName]);

  const filteredPob = useMemo(() => {
     let data = filterData(pobSlips, 'date');
     if (role === 'DRIVER') {
         data = data.filter(s => s.recipient.toLowerCase() === currentDriverName.toLowerCase());
     }
     return data.map(slip => {
        const originals = DataService.getPayOnBehalf();
        const original = originals.find(o => o.id === slip.refId);
        return { ...slip, original };
     });
  }, [pobSlips, startDate, endDate, role, currentDriverName]);

  const filteredRefunds = useMemo(() => {
      // Filter Refund Entries by Date Range
      return refundEntries.filter(r => {
          if (!r.refundDate) return false;
          const rDate = r.refundDate.split('T')[0];
          return rDate >= startDate && rDate <= endDate;
      }).map(r => {
          // Join with Slips to calculate Total Spent for this container
          const slipsForContainer = pobSlips.filter(s => s.containerNo === r.containerNo);
          const totalSpent = slipsForContainer.reduce((sum, s) => sum + s.amount, 0);
          
          return {
              ...r,
              totalSpent,
              diff: r.refundAmount - totalSpent,
              slipCount: slipsForContainer.length
          };
      });
  }, [refundEntries, pobSlips, startDate, endDate]);

  // Calculate Summaries
  const summaries = useMemo(() => {
      const fuelTotalCost = filteredFuel.reduce((sum, f) => sum + (f.actualCost || f.approvedCost || 0), 0);
      const fuelTotalLitres = filteredFuel.reduce((sum, f) => sum + (f.actualLitres || f.approvedLitres || f.amountLitres || 0), 0);
      
      return {
          fuel: {
              totalCost: fuelTotalCost,
              totalLitres: fuelTotalLitres,
              avgPrice: fuelTotalLitres > 0 ? fuelTotalCost / fuelTotalLitres : 0,
              count: filteredFuel.length,
              pendingCount: filteredFuel.filter(f => f.status === 'PENDING').length
          },
          expenses: {
              totalApproved: filteredExpenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0),
              totalPending: filteredExpenses.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.amount, 0),
              count: filteredExpenses.length,
              pendingCount: filteredExpenses.filter(e => e.status === 'PENDING').length
          },
          advances: {
              totalApproved: filteredAdvances.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + a.amount, 0),
              totalPending: filteredAdvances.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + a.amount, 0),
              countApproved: filteredAdvances.filter(a => a.status === 'APPROVED').length,
              countPending: filteredAdvances.filter(a => a.status === 'PENDING').length
          },
          salary: {
              totalTrip: filteredSalaries.reduce((sum, s) => sum + s.tripSalary, 0),
              totalHandling: filteredSalaries.reduce((sum, s) => sum + s.handlingFee, 0),
              trips: filteredSalaries.length
          },
          pob: {
              total: filteredPob.reduce((sum, p) => sum + p.amount, 0),
              count: filteredPob.length
          },
          refunds: {
              totalRefunded: filteredRefunds.reduce((sum, r) => sum + r.refundAmount, 0),
              totalDiff: filteredRefunds.reduce((sum, r) => sum + r.diff, 0),
              count: filteredRefunds.length
          }
      };
  }, [filteredFuel, filteredExpenses, filteredAdvances, filteredSalaries, filteredPob, filteredRefunds]);

  // NEW: Grouped Fuel by Driver & Vehicle
  const groupedFuelByDriver = useMemo(() => {
      const groups: Record<string, { 
          driverName: string, 
          totalCost: number, 
          totalLitres: number, 
          count: number,
          vehicles: Record<string, { plate: string, cost: number, litres: number, count: number }>
      }> = {};

      filteredFuel.forEach(f => {
          // Ignore rejected requests for financial stats
          if (f.status === 'REJECTED') return;

          const dId = f.driverId;
          // Priority: Actual (Completed) > Approved (Approved) > 0
          const cost = f.actualCost || f.approvedCost || 0;
          const litres = f.actualLitres || f.approvedLitres || f.amountLitres || 0;

          if (!groups[dId]) {
              const dr = drivers.find(d => d.id === dId);
              groups[dId] = {
                  driverName: dr ? dr.name : 'Unknown',
                  totalCost: 0,
                  totalLitres: 0,
                  count: 0,
                  vehicles: {}
              };
          }

          groups[dId].totalCost += cost;
          groups[dId].totalLitres += litres;
          groups[dId].count += 1;

          const vId = f.vehicleId || 'unknown';
          if (!groups[dId].vehicles[vId]) {
              const v = vehicles.find(veh => veh.id === vId);
              groups[dId].vehicles[vId] = {
                  plate: v ? v.plateNumber : 'Unknown',
                  cost: 0,
                  litres: 0,
                  count: 0
              };
          }
          groups[dId].vehicles[vId].cost += cost;
          groups[dId].vehicles[vId].litres += litres;
          groups[dId].vehicles[vId].count += 1;
      });

      return Object.values(groups).sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredFuel, drivers, vehicles]);

  // Calculate Grouped Salary by Driver WITH CARGO TYPE BREAKDOWN
  const groupedSalaryByDriver = useMemo(() => {
      const groups: Record<string, { 
          name: string, 
          tripCount: number, 
          totalTripSalary: number, 
          totalHandlingFee: number, 
          totalIncome: number,
          cargoTypes: Record<string, { count: number, total: number }> 
      }> = {};
      
      filteredSalaries.forEach(s => {
          const name = s.driverName;
          if (!groups[name]) {
              groups[name] = { 
                  name, 
                  tripCount: 0, 
                  totalTripSalary: 0, 
                  totalHandlingFee: 0, 
                  totalIncome: 0,
                  cargoTypes: {}
              };
          }
          groups[name].tripCount += 1;
          groups[name].totalTripSalary += s.tripSalary;
          groups[name].totalHandlingFee += s.handlingFee;
          groups[name].totalIncome += (s.tripSalary + s.handlingFee);

          // Cargo Breakdown
          const cargoKey = s.cargoType || 'Khác';
          if (!groups[name].cargoTypes[cargoKey]) {
              groups[name].cargoTypes[cargoKey] = { count: 0, total: 0 };
          }
          groups[name].cargoTypes[cargoKey].count += 1;
          groups[name].cargoTypes[cargoKey].total += (s.tripSalary + s.handlingFee);
      });

      return Object.values(groups).sort((a, b) => b.totalIncome - a.totalIncome);
  }, [filteredSalaries]);

  // Calculate Grouped Advances by Driver
  const groupedAdvancesByDriver = useMemo(() => {
      const groups: Record<string, { name: string, total: number, count: number }> = {};
      filteredAdvances.filter(a => a.status === 'APPROVED').forEach(adv => {
          const d = drivers.find(dr => dr.id === adv.driverId);
          const name = d ? d.name : 'Unknown';
          if (!groups[name]) groups[name] = { name, total: 0, count: 0 };
          groups[name].total += adv.amount;
          groups[name].count += 1;
      });
      return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredAdvances, drivers]);

  // Calculate Grouped Expenses by Driver
  const groupedExpensesByDriver = useMemo(() => {
      const groups: Record<string, { name: string, total: number, count: number }> = {};
      filteredExpenses.filter(e => e.status === 'APPROVED').forEach(exp => {
          const d = drivers.find(dr => dr.id === exp.driverId);
          const name = d ? d.name : 'Unknown';
          if (!groups[name]) groups[name] = { name, total: 0, count: 0 };
          groups[name].total += exp.amount;
          groups[name].count += 1;
      });
      return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, drivers]);

  // Calculate Grouped POB Stats (Customer Reconciliation -> Reason)
  const groupedPobStats = useMemo(() => {
      const groups: Record<string, { 
          total: number, 
          reasons: Record<string, number>,
          uniqueOriginalIds: Set<string>, 
          count20: number, // Separate count for 20
          count40: number  // Separate count for 40
      }> = {};
      
      filteredPob.forEach(slip => {
          const reconcileKey = slip.original?.customerReconciliation || 'Chưa đối chiếu';
          
          if (!groups[reconcileKey]) {
              groups[reconcileKey] = { 
                  total: 0, 
                  reasons: {},
                  uniqueOriginalIds: new Set(),
                  count20: 0,
                  count40: 0
              };
          }
          
          // Total Amount
          groups[reconcileKey].total += slip.amount;

          // Reasons Logic
          let reasonKey = 'Khác';
          for (const r of pobReasons) {
              if (slip.reason.startsWith(r.name)) {
                  reasonKey = r.name;
                  break;
              }
          }
          if(reasonKey === 'Khác' && slip.reason) {
             if (slip.reason.includes(':')) {
                 reasonKey = slip.reason.split(':')[0].trim();
             }
          }

          if (!groups[reconcileKey].reasons[reasonKey]) {
              groups[reconcileKey].reasons[reasonKey] = 0;
          }
          groups[reconcileKey].reasons[reasonKey] += slip.amount;

          // Container Count Logic (Dedup based on original record ID)
          if (slip.original && !groups[reconcileKey].uniqueOriginalIds.has(slip.original.id)) {
              groups[reconcileKey].uniqueOriginalIds.add(slip.original.id);
              groups[reconcileKey].count20 += (slip.original.count20 || 0);
              groups[reconcileKey].count40 += (slip.original.count40 || 0);
          }
      });

      return groups;
  }, [filteredPob, pobReasons]);

  // --- EXPORT TO EXCEL FUNCTION ---
  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let fileName = `BaoCao_${activeTab}_${startDate}_${endDate}.xlsx`;
    let sheetName = "Data";

    const statusMap: Record<string, string> = {
        'PENDING': 'Chờ duyệt',
        'APPROVED': 'Đã duyệt',
        'REJECTED': 'Từ chối',
        'COMPLETED': 'Hoàn tất'
    };

    switch (activeTab) {
        case 'fuel':
            sheetName = "NhienLieu";
            dataToExport = filteredFuel.map(f => {
                const v = DataService.getVehicles().find(veh => veh.id === f.vehicleId);
                const d = DataService.getDrivers().find(dr => dr.id === f.driverId);
                return {
                    "Ngày Yêu Cầu": formatDate(f.requestDate),
                    "Xe": v?.plateNumber || 'N/A',
                    "Tài xế": d?.name || 'N/A',
                    "Số tiền duyệt (Dự kiến)": f.approvedCost || 0,
                    "Số lít duyệt": f.approvedLitres || 0,
                    "Số tiền thực tế (Hoàn tất)": f.actualCost || 0,
                    "Số lít thực tế": f.actualLitres || 0,
                    "Trạm dầu": f.gasStation || '',
                    "Loại": f.isTemporary ? 'Dầu tạm' : 'Chính',
                    "Trạng thái": statusMap[f.status] || f.status
                };
            });
            break;
        case 'expenses':
            sheetName = "ChiPhi";
            dataToExport = filteredExpenses.map(e => {
                const d = DataService.getDrivers().find(dr => dr.id === e.driverId);
                return {
                    "Ngày": formatDate(e.date),
                    "Tài xế": d?.name || 'N/A',
                    "Hạng mục": e.category,
                    "Nội dung": e.reason,
                    "Số tiền": e.amount,
                    "Trạng thái": statusMap[e.status] || e.status
                };
            });
            break;
        case 'advances':
            sheetName = "TamUng";
            dataToExport = filteredAdvances.map(a => {
                const d = DataService.getDrivers().find(dr => dr.id === a.driverId);
                return {
                    "Ngày": formatDate(a.date),
                    "Tài xế": d?.name || 'N/A',
                    "Hạng mục": a.category,
                    "Lý do": a.reason,
                    "Số tiền": a.amount,
                    "Trạng thái": statusMap[a.status] || a.status
                };
            });
            break;
        case 'salary':
            sheetName = "LuongChuyen";
            dataToExport = filteredSalaries.map(s => ({
                "Ngày": formatDate(s.date),
                "Tài xế": s.driverName,
                "Loại hàng": s.cargoType,
                "Kho": s.warehouse,
                "Điểm kho": s.warehouseLocation,
                "Depot": s.depot,
                "Hạ/Trả": s.dropReturn,
                "Số Cont": s.containerNo,
                "Số lượng": s.quantity,
                "Cont 20": s.count20,
                "Cont 40": s.count40,
                "Lương Chuyến": s.tripSalary,
                "Tiền Làm Hàng": s.handlingFee
            }));
            break;
        case 'pob':
            sheetName = "ChiHo";
            dataToExport = filteredPob.map(p => ({
                "Ngày Chi": formatDate(p.date),
                "Đối chiếu KH": p.original?.customerReconciliation || '',
                "Người nhận": p.recipient,
                "Lý do/Nội dung": p.reason,
                "Số tiền": p.amount,
                "Biển số xe": p.vehiclePlate,
                "Số Cont": p.containerNo,
                "Booking/DO": p.original?.bookingDo || '',
                "Tác nghiệp gốc": p.original?.operation || ''
            }));
            break;
        case 'refunds':
            if (role !== 'ADMIN') return;
            sheetName = "HoanUng";
            dataToExport = filteredRefunds.map(r => ({
                "Ngày Hoàn Ứng": formatDate(r.refundDate),
                "Số Container": r.containerNo,
                "Số phiếu chi": r.slipCount,
                "Tổng Chi Hộ": r.totalSpent,
                "Số Tiền Hoàn": r.refundAmount,
                "Chênh Lệch": r.diff
            }));
            break;
    }

    if (dataToExport.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };

  const SummaryCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
      <div className={`p-4 rounded-xl border flex items-center space-x-4 bg-white shadow-sm ${colorClass}`}>
          <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('border', 'bg').replace('text', 'text')}`}>
              <Icon size={24} />
          </div>
          <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-xl font-bold">{value}</p>
              {subValue && <p className="text-xs opacity-75 mt-1">{subValue}</p>}
          </div>
      </div>
  );

  // Tab Definitions
  const tabs = [
    { id: 'fuel', label: 'Nhiên liệu' },
    { id: 'expenses', label: 'Chi phí tài xế' },
    { id: 'advances', label: 'Tạm ứng' },
    { id: 'salary', label: 'Lương & Chuyến' },
    { id: 'pob', label: 'Chi hộ' },
  ];

  // Only show Refunds tab to ADMIN
  if (role === 'ADMIN') {
      tabs.push({ id: 'refunds', label: 'Hoàn ứng' });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <BarChart3 className="mr-2" /> Báo cáo tổng hợp
          </h2>
          <p className="text-gray-500">Xem thống kê hoạt động theo thời gian.</p>
        </div>
        <button 
            onClick={handleExportExcel}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors"
        >
            <Download size={18} className="mr-2" /> Xuất Excel
        </button>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          <span className="font-medium text-sm text-gray-700">Thời gian:</span>
        </div>
        <input 
          type="date" 
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <span className="text-gray-400">-</span>
        <input 
          type="date" 
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        {role === 'DRIVER' && (
            <span className="ml-auto text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 font-medium">
                Đang xem dữ liệu của: {currentDriverName}
            </span>
        )}
      </div>

      {/* Detailed Summary Section based on Active Tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === 'fuel' && (
              <>
                <SummaryCard title="Tổng chi phí nhiên liệu" value={`${summaries.fuel.totalCost.toLocaleString()} đ`} icon={Fuel} colorClass="border-orange-200 text-orange-600" />
                <SummaryCard title="Tổng lượng dầu" value={`${summaries.fuel.totalLitres.toLocaleString()} Lít`} icon={TrendingUp} colorClass="border-blue-200 text-blue-600" />
                <SummaryCard title="Số lần đổ" value={`${summaries.fuel.count} lần`} subValue={`${summaries.fuel.pendingCount} phiếu chờ duyệt`} icon={Receipt} colorClass="border-gray-200 text-gray-600" />
                <SummaryCard title="Trung bình giá" value={`${Math.round(summaries.fuel.avgPrice).toLocaleString()} đ/l`} subValue="Ước tính" icon={DollarSign} colorClass="border-green-200 text-green-600" />
              </>
          )}
          {activeTab === 'expenses' && (
              <>
                <SummaryCard title="Đã duyệt chi" value={`${summaries.expenses.totalApproved.toLocaleString()} đ`} icon={CheckCircle2} colorClass="border-green-200 text-green-600" />
                <SummaryCard title="Đang chờ duyệt" value={`${summaries.expenses.totalPending.toLocaleString()} đ`} subValue={`${summaries.expenses.pendingCount} phiếu`} icon={Clock} colorClass="border-orange-200 text-orange-600" />
                <SummaryCard title="Tổng phiếu chi" value={`${summaries.expenses.count} phiếu`} icon={Receipt} colorClass="border-gray-200 text-gray-600" />
                <SummaryCard title="Tổng chi phí" value={`${(summaries.expenses.totalApproved + summaries.expenses.totalPending).toLocaleString()} đ`} icon={Wallet} colorClass="border-red-200 text-red-600" />
              </>
          )}
          {activeTab === 'advances' && (
              <>
                <SummaryCard title="Đã cấp (Đã duyệt)" value={`${summaries.advances.totalApproved.toLocaleString()} đ`} icon={Wallet} colorClass="border-purple-200 text-purple-600" />
                <SummaryCard title="Đang chờ duyệt" value={`${summaries.advances.totalPending.toLocaleString()} đ`} subValue={`${summaries.advances.countPending} phiếu`} icon={Clock} colorClass="border-yellow-200 text-yellow-600" />
                <SummaryCard title="Tổng phiếu ứng" value={`${summaries.advances.countApproved + summaries.advances.countPending} phiếu`} icon={Receipt} colorClass="border-gray-200 text-gray-600" />
                <SummaryCard title="Tổng giá trị" value={`${(summaries.advances.totalApproved + summaries.advances.totalPending).toLocaleString()} đ`} icon={TrendingUp} colorClass="border-blue-200 text-blue-600" />
              </>
          )}
          {activeTab === 'salary' && (
              <>
                <SummaryCard title="Tổng Lương Chuyến" value={`${summaries.salary.totalTrip.toLocaleString()} đ`} icon={DollarSign} colorClass="border-green-200 text-green-600" />
                <SummaryCard title="Tổng Tiền Làm Hàng" value={`${summaries.salary.totalHandling.toLocaleString()} đ`} icon={TrendingUp} colorClass="border-orange-200 text-orange-600" />
                <SummaryCard title="Tổng số chuyến" value={`${summaries.salary.trips} chuyến`} icon={Truck} colorClass="border-blue-200 text-blue-600" />
                <SummaryCard title="Thu nhập ước tính" value={`${(summaries.salary.totalTrip + summaries.salary.totalHandling).toLocaleString()} đ`} icon={Wallet} colorClass="border-teal-200 text-teal-600" />
              </>
          )}
          {activeTab === 'pob' && (
              <>
                <SummaryCard title="Tổng tiền chi hộ" value={`${summaries.pob.total.toLocaleString()} đ`} icon={CreditCard} colorClass="border-cyan-200 text-cyan-600" />
                <SummaryCard title="Số phiếu đã lập" value={`${summaries.pob.count} phiếu`} icon={Receipt} colorClass="border-gray-200 text-gray-600" />
              </>
          )}
          {activeTab === 'refunds' && role === 'ADMIN' && (
              <>
                <SummaryCard title="Tổng tiền Hoàn ứng" value={`${summaries.refunds.totalRefunded.toLocaleString()} đ`} icon={FileCheck} colorClass="border-green-200 text-green-600" />
                <SummaryCard title="Chênh lệch" value={`${summaries.refunds.totalDiff.toLocaleString()} đ`} icon={TrendingUp} colorClass={summaries.refunds.totalDiff >= 0 ? "border-blue-200 text-blue-600" : "border-red-200 text-red-600"} />
                <SummaryCard title="Số Cont đã hoàn" value={`${summaries.refunds.count} cont`} icon={Container} colorClass="border-gray-200 text-gray-600" />
              </>
          )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grouped Cards for POB */}
      {activeTab === 'pob' && Object.keys(groupedPobStats).length > 0 && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center">
                  <Layers size={16} className="mr-2"/> Tổng hợp theo Đối chiếu KH
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(groupedPobStats).map(([key, data]) => (
                      <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-100">
                              <div className="flex-1 min-w-0 mr-2">
                                <span className="font-bold text-gray-800 text-sm break-words block" title={key}>{key}</span>
                                <div className="text-xs text-gray-500 font-medium mt-1">
                                    SL Cont: <span className="font-bold text-gray-800">{data.count20 + data.count40}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0 gap-1">
                                  {data.count20 > 0 && (
                                      <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center">
                                          <Container size={10} className="mr-1" /> 20': {data.count20}
                                      </span>
                                  )}
                                  {data.count40 > 0 && (
                                      <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center">
                                          <Container size={10} className="mr-1" /> 40': {data.count40}
                                      </span>
                                  )}
                                  {data.count20 === 0 && data.count40 === 0 && (
                                      <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                          0 Cont
                                      </span>
                                  )}
                              </div>
                          </div>
                          <div className="flex-1 space-y-2 mb-3 overflow-y-auto max-h-[150px] custom-scrollbar">
                              {Object.entries(data.reasons).map(([reason, amount]) => (
                                  <div key={reason} className="flex justify-between text-xs">
                                      <span className="text-gray-500 truncate mr-2" title={reason}>{reason}</span>
                                      <span className="font-medium text-gray-700">{amount.toLocaleString()}</span>
                                  </div>
                              ))}
                          </div>
                          <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                              <span className="text-xs text-gray-400 font-medium">Tổng tiền</span>
                              <span className="text-lg font-bold text-orange-600">{data.total.toLocaleString()} đ</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* NEW: Fuel by Driver Summary */}
      {activeTab === 'fuel' && (role === 'ADMIN' || role === 'MANAGER') && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center">
                  <User size={16} className="mr-2"/> Tổng chi phí nhiên liệu theo Tài xế & Xe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupedFuelByDriver.map((item) => (
                      <div key={item.driverName} className="bg-orange-50 rounded-lg p-3 border border-orange-100 flex flex-col hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-2 border-b border-orange-200 pb-2">
                              <span className="text-sm font-bold text-orange-900 truncate flex-1" title={item.driverName}>{item.driverName}</span>
                              <span className="text-lg font-bold text-orange-700">{item.totalCost.toLocaleString()}</span>
                          </div>
                          <div className="space-y-2 flex-1">
                              {Object.values(item.vehicles).map((v) => (
                                  <div key={v.plate} className="bg-white p-2 rounded border border-orange-100 text-xs">
                                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                                          <span>{v.plate}</span>
                                          <span>{v.count} chuyến</span>
                                      </div>
                                      <div className="flex justify-between text-gray-600">
                                          <span>Tiền: {v.cost.toLocaleString()}</span>
                                          <span>Lít: {v.litres.toLocaleString()}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-orange-200 flex justify-between text-xs font-medium text-orange-800">
                              <span>Tổng lít: {item.totalLitres.toLocaleString()} L</span>
                              <span>{item.count} phiếu</span>
                          </div>
                      </div>
                  ))}
                  {groupedFuelByDriver.length === 0 && <p className="text-sm text-gray-400 italic col-span-full">Chưa có dữ liệu nhiên liệu.</p>}
              </div>
          </div>
      )}

      {/* NEW: Advances by Driver Summary */}
      {activeTab === 'advances' && role === 'ADMIN' && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center">
                  <User size={16} className="mr-2"/> Tổng tiền tạm ứng theo Tài xế (Đã duyệt)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {groupedAdvancesByDriver.map((item) => (
                      <div key={item.name} className="bg-purple-50 rounded-lg p-3 border border-purple-100 flex flex-col justify-between">
                          <span className="text-xs font-bold text-purple-900 truncate" title={item.name}>{item.name}</span>
                          <div className="flex justify-between items-end mt-1">
                              <span className="text-[10px] text-purple-600 bg-white px-1.5 rounded-full border border-purple-100">{item.count} phiếu</span>
                              <span className="text-sm font-bold text-purple-700">{item.total.toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
                  {groupedAdvancesByDriver.length === 0 && <p className="text-sm text-gray-400 italic col-span-full">Chưa có dữ liệu tạm ứng đã duyệt.</p>}
              </div>
          </div>
      )}

      {/* NEW: Expenses by Driver Summary */}
      {activeTab === 'expenses' && role === 'ADMIN' && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center">
                  <User size={16} className="mr-2"/> Tổng chi phí theo Tài xế (Đã duyệt)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {groupedExpensesByDriver.map((item) => (
                      <div key={item.name} className="bg-red-50 rounded-lg p-3 border border-red-100 flex flex-col justify-between">
                          <span className="text-xs font-bold text-red-900 truncate" title={item.name}>{item.name}</span>
                          <div className="flex justify-between items-end mt-1">
                              <span className="text-[10px] text-red-600 bg-white px-1.5 rounded-full border border-red-100">{item.count} phiếu</span>
                              <span className="text-sm font-bold text-red-700">{item.total.toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
                  {groupedExpensesByDriver.length === 0 && <p className="text-sm text-gray-400 italic col-span-full">Chưa có dữ liệu chi phí đã duyệt.</p>}
              </div>
          </div>
      )}

      {/* NEW: Salary by Driver Summary */}
      {activeTab === 'salary' && (role === 'ADMIN' || role === 'MANAGER') && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center">
                  <User size={16} className="mr-2"/> Thống kê thu nhập theo Tài xế
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {groupedSalaryByDriver.map((item, index) => {
                      const color = DRIVER_COLORS[index % DRIVER_COLORS.length];
                      return (
                      <div key={item.name} className={`${color.bg} rounded-lg p-3 border ${color.border} flex flex-col hover:shadow-sm transition-shadow`}>
                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-sm font-bold ${color.text} truncate`} title={item.name}>{item.name}</span>
                              <span className={`text-[10px] ${color.badge} px-2 py-0.5 rounded-full border font-bold`}>{item.tripCount} chuyến</span>
                          </div>
                          
                          {/* Stats Breakdown */}
                          <div className={`space-y-1 mb-2 pb-2 border-b ${color.border}`}>
                              <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Lương chuyến</span>
                                  <span className="font-bold text-gray-700">{item.totalTripSalary.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Làm hàng</span>
                                  <span className="font-bold text-orange-600">{item.totalHandlingFee.toLocaleString()}</span>
                              </div>
                          </div>

                          {/* Cargo Type Breakdown */}
                          {Object.keys(item.cargoTypes).length > 0 && (
                              <div className="mb-2 space-y-1">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Phân loại hàng</p>
                                  {Object.entries(item.cargoTypes).map(([type, stats]) => (
                                      <div key={type} className="flex justify-between text-[10px] items-center bg-white px-1.5 py-0.5 rounded border border-gray-100">
                                          <span className="truncate max-w-[60%] text-gray-600" title={type}>{type}</span>
                                          <span className={`font-medium ${color.sub}`}>{stats.total.toLocaleString()} ({stats.count})</span>
                                      </div>
                                  ))}
                              </div>
                          )}

                          <div className={`mt-auto pt-1 flex justify-between text-sm border-t ${color.border}`}>
                              <span className={`font-bold ${color.text}`}>Tổng</span>
                              <span className={`font-bold ${color.text}`}>{item.totalIncome.toLocaleString()}</span>
                          </div>
                      </div>
                  )})}
                  {groupedSalaryByDriver.length === 0 && <p className="text-sm text-gray-400 italic col-span-full">Chưa có dữ liệu lương.</p>}
              </div>
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          {activeTab === 'fuel' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Ngày</th>
                  <th className="px-6 py-3">Xe</th>
                  <th className="px-6 py-3">Duyệt (Dự kiến)</th>
                  <th className="px-6 py-3">Thực tế (Hoàn tất)</th>
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFuel.map(f => {
                   const v = DataService.getVehicles().find(veh => veh.id === f.vehicleId);
                   return (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">{formatDate(f.requestDate)}</td>
                      <td className="px-6 py-3 font-bold">{v?.plateNumber || 'Unknown'}</td>
                      <td className="px-6 py-3">
                        {f.isFullTank ? <span className="text-orange-600 font-bold">Đầy bình</span> : (f.approvedCost ? `${f.approvedCost.toLocaleString()} đ` : '-')}
                        {f.approvedLitres && <div className="text-xs text-gray-500">~{f.approvedLitres} lít</div>}
                      </td>
                      <td className="px-6 py-3">
                        {f.status === 'COMPLETED' ? (
                            <>
                                <span className="font-bold text-green-700">{f.actualCost ? `${f.actualCost.toLocaleString()} đ` : '-'}</span>
                                {f.actualLitres && <div className="text-xs text-gray-500">{f.actualLitres} lít</div>}
                            </>
                        ) : (
                            <span className="text-gray-400 text-xs">Chưa hoàn tất</span>
                        )}
                      </td>
                      <td className="px-6 py-3">{getStatusBadge(f.status)}</td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'expenses' && (
             <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Ngày</th>
                  <th className="px-6 py-3">Hạng mục</th>
                  <th className="px-6 py-3">Nội dung</th>
                  <th className="px-6 py-3">Số tiền</th>
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{formatDate(e.date)}</td>
                    <td className="px-6 py-3 font-bold">{e.category}</td>
                    <td className="px-6 py-3">{e.reason}</td>
                    <td className="px-6 py-3 text-red-600 font-bold">{e.amount.toLocaleString()} đ</td>
                    <td className="px-6 py-3">{getStatusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'advances' && (
             <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Ngày</th>
                  <th className="px-6 py-3">Hạng mục</th>
                  <th className="px-6 py-3">Lý do</th>
                  <th className="px-6 py-3">Số tiền</th>
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdvances.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{formatDate(a.date)}</td>
                    <td className="px-6 py-3 font-bold">{a.category}</td>
                    <td className="px-6 py-3">{a.reason}</td>
                    <td className="px-6 py-3 text-primary font-bold">{a.amount.toLocaleString()} đ</td>
                    <td className="px-6 py-3">{getStatusBadge(a.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'salary' && (
             <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Ngày</th>
                  <th className="px-6 py-3">Tài xế</th>
                  <th className="px-6 py-3">Loại hàng</th>
                  <th className="px-6 py-3">Cont/DO</th>
                  <th className="px-6 py-3 text-right">Lương chuyến</th>
                  <th className="px-6 py-3 text-right">Tiền làm hàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSalaries.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{formatDate(s.date)}</td>
                    <td className="px-6 py-3 font-bold">{s.driverName}</td>
                    <td className="px-6 py-3">{s.cargoType}</td>
                    <td className="px-6 py-3 font-mono">{s.containerNo}</td>
                    <td className="px-6 py-3 text-right text-blue-600 font-bold">{s.tripSalary.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-orange-600 font-bold">{s.handlingFee.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {activeTab === 'pob' && (
             <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Đối chiếu KH</th>
                  <th className="px-6 py-3">Lý do chi / Nội dung</th>
                  <th className="px-6 py-3 text-right">Tổng Tiền</th>
                  <th className="px-6 py-3">Ngày Chi</th>
                  <th className="px-6 py-3">BS Xe</th>
                  <th className="px-6 py-3">Số Cont - BK/DO</th>
                  <th className="px-6 py-3">Người nhận tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPob.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-bold text-gray-800 bg-orange-50/20 max-w-[200px] truncate" title={p.original?.customerReconciliation}>
                          {p.original?.customerReconciliation || '-'}
                      </td>
                      <td className="px-6 py-3 text-gray-700 italic max-w-[200px] truncate" title={p.reason}>
                          {p.reason}
                      </td>
                      <td className="px-6 py-3 font-bold text-right text-red-600">
                          {p.amount.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-600">{formatDate(p.date)}</td>
                      <td className="px-6 py-3 font-bold text-gray-800">{p.vehiclePlate}</td>
                      <td className="px-6 py-3">
                         <div className="text-sm font-medium">{p.containerNo}</div>
                         <div className="text-xs text-gray-500">{p.original?.bookingDo || '-'}</div>
                      </td>
                      <td className="px-6 py-3 font-bold text-blue-700">
                         {p.recipient}
                      </td>
                    </tr>
                  );
                })}
                {filteredPob.length === 0 && (
                   <tr><td colSpan={7} className="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'refunds' && role === 'ADMIN' && (
             <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Ngày Hoàn Ứng</th>
                  <th className="px-6 py-3">Số Container</th>
                  <th className="px-6 py-3 text-center">Số phiếu chi</th>
                  <th className="px-6 py-3 text-right">Tổng Chi Hộ</th>
                  <th className="px-6 py-3 text-right">Số Tiền Hoàn</th>
                  <th className="px-6 py-3 text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRefunds.map((r, idx) => {
                  let diffColor = 'text-gray-800';
                  if (r.diff < 0) diffColor = 'text-red-600 font-bold';
                  else if (r.diff > 0) diffColor = 'text-green-600 font-bold';

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-600">{formatDate(r.refundDate)}</td>
                      <td className="px-6 py-3 font-bold text-gray-800 font-mono">{r.containerNo}</td>
                      <td className="px-6 py-3 text-center">{r.slipCount}</td>
                      <td className="px-6 py-3 text-right font-medium text-orange-600">{r.totalSpent.toLocaleString()} đ</td>
                      <td className="px-6 py-3 text-right font-bold text-green-700">{r.refundAmount.toLocaleString()} đ</td>
                      <td className={`px-6 py-3 text-right ${diffColor}`}>{r.diff.toLocaleString()} đ</td>
                    </tr>
                  );
                })}
                {filteredRefunds.length === 0 && (
                   <tr><td colSpan={6} className="text-center py-8 text-gray-400">Không có dữ liệu hoàn ứng trong khoảng thời gian này</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
