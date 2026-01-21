
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Calendar, Filter, Download } from 'lucide-react';
import { Role, FuelRequest, DriverExpense, MoneyAdvance, DriverSalary, PayOnBehalfSlip } from '../types';
import { DataService } from '../services/dataService';

interface ReportsProps {
  role: Role;
}

const Reports: React.FC<ReportsProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses' | 'advances' | 'salary' | 'pob'>('fuel');
  
  // Data states
  const [fuelRequests, setFuelRequests] = useState<FuelRequest[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [advances, setAdvances] = useState<MoneyAdvance[]>([]);
  const [salaries, setSalaries] = useState<DriverSalary[]>([]);
  const [pobSlips, setPobSlips] = useState<PayOnBehalfSlip[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setFuelRequests(DataService.getFuelRequests());
    setExpenses(DataService.getDriverExpenses());
    setAdvances(DataService.getMoneyAdvances());
    setSalaries(DataService.getDriverSalaries());
    setPobSlips(DataService.getPayOnBehalfSlips());
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const filterData = (data: any[], dateField: string) => {
    return data.filter(item => {
      const itemDate = item[dateField]?.split('T')[0];
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredFuel = useMemo(() => filterData(fuelRequests, 'requestDate'), [fuelRequests, startDate, endDate]);
  const filteredExpenses = useMemo(() => filterData(expenses, 'date'), [expenses, startDate, endDate]);
  const filteredAdvances = useMemo(() => filterData(advances, 'date'), [advances, startDate, endDate]);
  const filteredSalaries = useMemo(() => filterData(salaries, 'date'), [salaries, startDate, endDate]);
  const filteredPob = useMemo(() => {
     // PayOnBehalfSlip
     return filterData(pobSlips, 'date').map(slip => {
        // Enriched with original data if needed, but the slip itself has basic info
        // The fragment used `p.original` suggesting it might be joined with PayOnBehalf items.
        // Let's check `DataService` for PayOnBehalf items.
        const originals = DataService.getPayOnBehalf();
        const original = originals.find(o => o.id === slip.refId);
        return { ...slip, original };
     });
  }, [pobSlips, startDate, endDate]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <BarChart3 className="mr-2" /> Báo cáo tổng hợp
          </h2>
          <p className="text-gray-500">Xem thống kê hoạt động theo thời gian.</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          <span className="font-medium text-sm text-gray-700">Thời gian:</span>
        </div>
        <input 
          type="date" 
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <span className="text-gray-400">-</span>
        <input 
          type="date" 
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'fuel', label: 'Nhiên liệu' },
          { id: 'expenses', label: 'Chi phí tài xế' },
          { id: 'advances', label: 'Tạm ứng' },
          { id: 'salary', label: 'Lương & Chuyến' },
          { id: 'pob', label: 'Chi hộ' },
        ].map(tab => (
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          {activeTab === 'fuel' && (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Ngày</th>
                  <th className="px-6 py-3">Xe</th>
                  <th className="px-6 py-3">Số lít / Tiền</th>
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
                        {f.isFullTank ? 'Đầy bình' : (f.approvedCost ? `${f.approvedCost.toLocaleString()} đ` : '-')}
                        {f.amountLitres && <div className="text-xs text-gray-500">{f.amountLitres} lít</div>}
                      </td>
                      <td className="px-6 py-3">{f.status}</td>
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
                    <td className="px-6 py-3">{e.status}</td>
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
                    <td className="px-6 py-3">{a.status}</td>
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
                  <th className="px-6 py-3">Ngày Chi</th>
                  <th className="px-6 py-3">BS Xe</th>
                  <th className="px-6 py-3">Số Cont - BK/DO</th>
                  <th className="px-6 py-3">Tác nghiệp (Gốc)</th>
                  <th className="px-6 py-3">Người nhận tiền</th>
                  <th className="px-6 py-3">Đối chiếu KH</th>
                  <th className="px-6 py-3">Lý do / Nội dung</th>
                  <th className="px-6 py-3 text-right">Tiền đã chi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPob.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-600">{formatDate(p.date)}</td>
                      <td className="px-6 py-3 font-bold text-gray-800">{p.vehiclePlate}</td>
                      <td className="px-6 py-3">
                         <div className="text-sm font-medium">{p.containerNo}</div>
                         <div className="text-xs text-gray-500">{p.original?.bookingDo || '-'}</div>
                      </td>
                      <td className="px-6 py-3">
                         <span className="inline-flex items-center px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-bold border border-cyan-100">
                           {p.original?.operation || 'Khác'}
                         </span>
                      </td>
                      <td className="px-6 py-3 font-bold text-blue-700">
                         {p.recipient}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs italic max-w-[150px] truncate" title={p.original?.customerReconciliation}>
                          {p.original?.customerReconciliation || '-'}
                      </td>
                      <td className="px-6 py-3 text-gray-600 text-xs italic max-w-[200px] truncate" title={p.reason}>
                          {p.reason}
                      </td>
                      <td className="px-6 py-3 font-bold text-right text-cyan-700">
                          {p.amount.toLocaleString()} đ
                      </td>
                    </tr>
                  );
                })}
                {filteredPob.length === 0 && (
                   <tr><td colSpan={8} className="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>
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
