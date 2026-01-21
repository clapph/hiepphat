
import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Upload, Save, Trash2, Search, Calendar, AlertCircle, User, ChevronDown, ChevronUp, Layers, Container, Filter, RefreshCw } from 'lucide-react';
import { Role, DriverSalary, Driver } from '../types';
import { DataService } from '../services/dataService';

interface SalaryProps {
  role: Role;
}

const Salary: React.FC<SalaryProps> = ({ role }) => {
  const [salaries, setSalaries] = useState<DriverSalary[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Filters
  // Default to first day of current month and today
  const [filterFromDate, setFilterFromDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [filterToDate, setFilterToDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [filterDriver, setFilterDriver] = useState('');
  const [filterCargo, setFilterCargo] = useState('');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Mock logged in driver name for demo (ID: d1 -> Nguyễn Văn A)
  const currentDriverName = "Nguyễn Văn A"; 

  const loadData = () => {
    setSalaries(DataService.getDriverSalaries());
    setDrivers(DataService.getDrivers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Xóa bản ghi lương này?')) {
      DataService.deleteDriverSalary(id);
      loadData();
    }
  };

  // --- IMPORT LOGIC ---
  const parseImportText = () => {
    if (!importText.trim()) {
      alert("Vui lòng dán dữ liệu vào ô trống.");
      return;
    }

    const lines = importText.split('\n');
    const parsed: any[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      // Split by tab (Excel copy/paste format)
      const cols = line.split('\t').map(c => c.trim());
      
      // Basic check for column count (At least 13 as per requirement)
      if (cols.length < 13) {
        errors.push(`Dòng ${index + 1}: Thiếu cột (Tìm thấy ${cols.length}/13 cột)`);
        return;
      }

      // Helper to parse currency string
      const parseNum = (str: string) => {
        if (!str) return 0;
        const clean = str.replace(/\./g, '').replace(/,/g, ''); 
        const num = Number(clean);
        return isNaN(num) ? 0 : num;
      };

      // Helper to parse Date
      const parseDate = (str: string) => {
        if (!str) return new Date().toISOString(); 
        if (str.includes('/')) {
           const parts = str.split('/');
           if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`; 
        }
        return str; 
      }

      parsed.push({
        date: parseDate(cols[0]),
        driverName: cols[1],
        cargoType: cols[2],
        warehouse: cols[3],
        warehouseLocation: cols[4],
        depot: cols[5],
        dropReturn: cols[6],
        containerNo: cols[7],
        quantity: cols[8],
        count20: parseNum(cols[9]),
        count40: parseNum(cols[10]),
        tripSalary: parseNum(cols[11]),
        handlingFee: parseNum(cols[12])
      });
    });

    setPreviewData(parsed);
    setImportErrors(errors);
  };

  const saveImport = () => {
    if (previewData.length === 0) return;
    DataService.addDriverSalariesBulk(previewData);
    setImportText('');
    setPreviewData([]);
    setImportErrors([]);
    setIsImportModalOpen(false);
    loadData();
    alert(`Đã nhập thành công ${previewData.length} dòng!`);
  };

  // --- DATA PROCESSING ---

  // 1. Filter Data Global
  const filteredList = useMemo(() => {
    return salaries.filter(s => {
        // Date Range
        const sDate = s.date.split('T')[0];
        const dateMatch = sDate >= filterFromDate && sDate <= filterToDate;

        // Cargo Type
        const cargoMatch = filterCargo ? s.cargoType.toLowerCase().includes(filterCargo.toLowerCase()) : true;

        // Driver Filtering
        let driverMatch = true;
        if (role === 'DRIVER') {
            // Strict match for logged in driver
            driverMatch = s.driverName.toLowerCase() === currentDriverName.toLowerCase();
        } else {
            // Admin filter
            driverMatch = filterDriver ? s.driverName.toLowerCase().includes(filterDriver.toLowerCase()) : true;
        }
        
        return dateMatch && driverMatch && cargoMatch;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [salaries, filterFromDate, filterToDate, filterDriver, filterCargo, role]);

  // 2. Group by Driver
  const groupedData = useMemo(() => {
      const groups: Record<string, DriverSalary[]> = {};
      filteredList.forEach(item => {
          if (!groups[item.driverName]) groups[item.driverName] = [];
          groups[item.driverName].push(item);
      });
      return groups;
  }, [filteredList]);

  // Global Totals
  const totalSalary = filteredList.reduce((sum, s) => sum + s.tripSalary, 0);
  const totalHandling = filteredList.reduce((sum, s) => sum + s.handlingFee, 0);

  const resetFilters = () => {
      const date = new Date();
      setFilterFromDate(new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]);
      setFilterToDate(new Date().toISOString().split('T')[0]);
      setFilterDriver('');
      setFilterCargo('');
  };

  // --- RENDER COMPONENT: DRIVER CARD ---
  const DriverCard = ({ driverName, items }: { driverName: string, items: DriverSalary[] }) => {
      const [isExpanded, setIsExpanded] = useState(true);
      const [activeTab, setActiveTab] = useState<'general' | 'container'>('general');

      // Split Logic: Type 1 (Empty 6 & 7) vs Type 2 (Has Data)
      const listType1 = items.filter(i => (!i.depot || i.depot.trim() === '') && (!i.dropReturn || i.dropReturn.trim() === ''));
      const listType2 = items.filter(i => (i.depot && i.depot.trim() !== '') || (i.dropReturn && i.dropReturn.trim() !== ''));

      // Auto-switch tab if one list is empty
      useEffect(() => {
          if (listType1.length === 0 && listType2.length > 0) {
              setActiveTab('container');
          } else if (listType1.length > 0) {
              setActiveTab('general');
          }
      }, [items.length]);

      // Totals for this driver
      const drSalary = items.reduce((sum, s) => sum + s.tripSalary, 0);
      const drHandling = items.reduce((sum, s) => sum + s.handlingFee, 0);

      // Reusable Sub-Table Renderer
      // isContainerTab: controls hiding specific columns like Quantity
      const renderSubTable = (data: DriverSalary[], isContainerTab: boolean) => {
          if (data.length === 0) return <div className="p-8 text-center text-gray-400 italic">Không có dữ liệu</div>;

          // Check dynamic columns specifically for this sub-table
          // For General Tab: Check if columns have data (usually they are empty per split logic, but good to be safe)
          // For Container Tab: We typically show these
          const hasDepot = isContainerTab || data.some(i => i.depot && i.depot.trim() !== '');
          const hasDrop = isContainerTab || data.some(i => i.dropReturn && i.dropReturn.trim() !== '');
          const has20 = isContainerTab || data.some(i => i.count20 && i.count20 > 0);
          const has40 = isContainerTab || data.some(i => i.count40 && i.count40 > 0);
          
          // Should we show Quantity (SL)? 
          // Request: Hide SL (Column 9) for Container Goods
          const showQuantity = !isContainerTab;

          return (
            <div className="animate-fade-in">
               <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                      <thead className="bg-white text-gray-600 font-bold uppercase whitespace-nowrap border-b border-gray-100">
                          <tr>
                              <th className="px-3 py-3 w-24">Ngày</th>
                              <th className="px-3 py-3">Loại hàng</th>
                              <th className="px-3 py-3">Kho đóng/nhập</th>
                              <th className="px-3 py-3">Điểm kho</th>
                              {/* Dynamic Columns */}
                              {hasDepot && <th className="px-3 py-3 bg-blue-50/50 text-blue-800">Depot</th>}
                              {hasDrop && <th className="px-3 py-3 bg-blue-50/50 text-blue-800">Hạ/Trả</th>}
                              
                              <th className="px-3 py-3">Số Cont/DO</th>
                              
                              {/* Show Quantity only for General Goods */}
                              {showQuantity && <th className="px-3 py-3">SL</th>}
                              
                              {/* Dynamic Columns */}
                              {has20 && <th className="px-3 py-3 text-center w-10">20'</th>}
                              {has40 && <th className="px-3 py-3 text-center w-10">40'</th>}
                              
                              <th className="px-3 py-3 text-right bg-blue-50/30">Lương Chuyến</th>
                              <th className="px-3 py-3 text-right bg-orange-50/30">Tiền LH</th>
                              {role === 'ADMIN' && <th className="px-3 py-3 text-center w-10">Xóa</th>}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 whitespace-nowrap">
                          {data.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2.5 text-gray-600 font-medium">
                                      {new Date(item.date).toLocaleDateString('vi-VN')}
                                  </td>
                                  <td className="px-3 py-2.5">{item.cargoType}</td>
                                  <td className="px-3 py-2.5">{item.warehouse}</td>
                                  <td className="px-3 py-2.5 max-w-[150px] truncate" title={item.warehouseLocation}>
                                      {item.warehouseLocation}
                                  </td>
                                  
                                  {/* Dynamic Columns Data */}
                                  {hasDepot && <td className="px-3 py-2.5 text-blue-700 bg-blue-50/20">{item.depot}</td>}
                                  {hasDrop && <td className="px-3 py-2.5 text-blue-700 bg-blue-50/20">{item.dropReturn}</td>}
                                  
                                  <td className="px-3 py-2.5 font-mono text-gray-700">{item.containerNo}</td>
                                  
                                  {/* Quantity Data */}
                                  {showQuantity && <td className="px-3 py-2.5">{item.quantity}</td>}
                                  
                                  {/* Dynamic Columns Data */}
                                  {has20 && <td className="px-3 py-2.5 text-center font-bold">{item.count20 || ''}</td>}
                                  {has40 && <td className="px-3 py-2.5 text-center font-bold">{item.count40 || ''}</td>}
                                  
                                  <td className="px-3 py-2.5 text-right font-bold text-blue-700 bg-blue-50/30">
                                      {item.tripSalary.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-bold text-orange-700 bg-orange-50/30">
                                      {item.handlingFee.toLocaleString()}
                                  </td>
                                  
                                  {role === 'ADMIN' && (
                                      <td className="px-3 py-2.5 text-center">
                                          <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                              <Trash2 size={14} />
                                          </button>
                                      </td>
                                  )}
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>
            </div>
          );
      };

      return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in">
              {/* Card Header */}
              <div 
                className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                  <div className="flex items-center gap-3 mb-2 md:mb-0">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                          <User size={20} />
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-800 text-lg">{driverName}</h3>
                          <div className="flex gap-2 mt-1">
                             <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{items.length} chuyến tổng</span>
                             {role === 'DRIVER' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">Dữ liệu của bạn</span>}
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                      <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Lương chuyến</p>
                          <p className="text-primary font-bold">{drSalary.toLocaleString()} đ</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Tiền làm hàng</p>
                          <p className="text-orange-600 font-bold">{drHandling.toLocaleString()} đ</p>
                      </div>
                      <div className="pl-4 border-l border-gray-300 text-gray-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                  </div>
              </div>

              {/* Card Body (Tabs & Content) */}
              {isExpanded && (
                  <div>
                      {/* Tabs Navigation */}
                      <div className="flex border-b border-gray-200 px-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveTab('general'); }}
                            className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === 'general' 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                             <Layers size={16} className="mr-2" /> 
                             Hàng Thường / Khác 
                             <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-normal border">
                                {listType1.length}
                             </span>
                          </button>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveTab('container'); }}
                            className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === 'container' 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                             <Container size={16} className="mr-2" /> 
                             Hàng Container 
                             <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-normal border">
                                {listType2.length}
                             </span>
                          </button>
                      </div>

                      {/* Tab Content */}
                      <div className="p-0">
                          {activeTab === 'general' && renderSubTable(listType1, false)}
                          {activeTab === 'container' && renderSubTable(listType2, true)}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <DollarSign className="mr-2" /> Lương & Chuyến xe
          </h2>
          <p className="text-gray-500">Quản lý chi tiết lương chuyến và tiền làm hàng.</p>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors"
          >
            <Upload size={18} className="mr-2" /> Import Dữ liệu
          </button>
        )}
      </header>

      {/* Filters & Global Summary */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-10">
         <div className="flex flex-col gap-3 w-full md:w-auto flex-1">
             <div className="flex items-center gap-2 text-primary font-bold">
                <Filter size={16} /> Bộ lọc:
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Từ ngày</label>
                    <input 
                        type="date" 
                        className="border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                        value={filterFromDate}
                        onChange={e => setFilterFromDate(e.target.value)}
                    />
                 </div>
                 <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Đến ngày</label>
                    <input 
                        type="date" 
                        className="border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                        value={filterToDate}
                        onChange={e => setFilterToDate(e.target.value)}
                    />
                 </div>
                 {role !== 'DRIVER' && (
                     <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold uppercase">Tài xế</label>
                        <input 
                            type="text" 
                            placeholder="Tìm tên..."
                            className="border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                            value={filterDriver}
                            onChange={e => setFilterDriver(e.target.value)}
                        />
                     </div>
                 )}
                 <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Loại hàng</label>
                    <input 
                        type="text" 
                        placeholder="VD: Xi măng..."
                        className="border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                        value={filterCargo}
                        onChange={e => setFilterCargo(e.target.value)}
                    />
                 </div>
             </div>
         </div>

         <div className="flex items-center gap-4">
            <button 
                onClick={resetFilters}
                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg"
                title="Đặt lại bộ lọc"
            >
                <RefreshCw size={18} />
            </button>
            <div className="flex gap-6 text-right border-l pl-6 border-gray-200">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Tổng Lương</p>
                    <p className="text-lg font-bold text-primary">{totalSalary.toLocaleString()} đ</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Tổng Tiền LH</p>
                    <p className="text-lg font-bold text-orange-600">{totalHandling.toLocaleString()} đ</p>
                </div>
            </div>
         </div>
      </div>

      {/* DRIVER CARDS LIST */}
      <div className="space-y-6">
          {Object.keys(groupedData).length > 0 ? (
              Object.entries(groupedData).map(([driverName, items]) => (
                  <DriverCard key={driverName} driverName={driverName} items={items} />
              ))
          ) : (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                  <p>Không có dữ liệu phù hợp với bộ lọc</p>
              </div>
          )}
      </div>

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-6 h-[90vh] flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                   <Upload size={24} className="mr-2 text-green-600" /> Import Lương Tài xế
                </h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-gray-500 hover:text-gray-700">Đóng</button>
             </div>

             <div className="flex-1 overflow-hidden flex flex-col gap-4">
                {/* Step 1: Input Area */}
                {previewData.length === 0 ? (
                   <div className="flex-1 flex flex-col">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 text-sm text-blue-800">
                         <p className="font-bold mb-1 flex items-center"><AlertCircle size={16} className="mr-2"/> Hướng dẫn:</p>
                         <p>1. Copy dữ liệu từ File Excel hoặc Google Sheet (Bao gồm 13 cột theo thứ tự: Ngày, Tài xế, Loại hàng, Kho, Điểm kho, Depot, Hạ cont, Số cont, SL, 20, 40, Lương chuyến, Tiền LH).</p>
                         <p>2. Dán (Paste) vào ô bên dưới.</p>
                         <p>3. Nhấn "Xem trước" để kiểm tra.</p>
                      </div>
                      <textarea 
                        className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-xs"
                        placeholder="Dán dữ liệu vào đây..."
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                      />
                      <div className="mt-4 flex justify-end">
                         <button 
                           onClick={parseImportText}
                           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm"
                         >
                           Xem trước dữ liệu
                         </button>
                      </div>
                   </div>
                ) : (
                   /* Step 2: Preview Area */
                   <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                         <p className="text-sm text-gray-600">
                            Đã tìm thấy <strong className="text-primary">{previewData.length}</strong> dòng hợp lệ.
                         </p>
                         <button 
                           onClick={() => { setPreviewData([]); setImportErrors([]); }}
                           className="text-sm text-blue-600 hover:underline"
                         >
                           Quay lại / Nhập lại
                         </button>
                      </div>
                      
                      {importErrors.length > 0 && (
                         <div className="bg-red-50 p-2 rounded-lg border border-red-100 mb-2 max-h-24 overflow-y-auto text-xs text-red-700">
                            <strong>Lỗi định dạng:</strong>
                            <ul className="list-disc pl-4">
                               {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                         </div>
                      )}

                      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                         <table className="w-full text-xs text-left whitespace-nowrap">
                            <thead className="bg-gray-100 text-gray-700 sticky top-0">
                               <tr>
                                  <th className="p-2 border-b">Ngày</th>
                                  <th className="p-2 border-b">Tài xế</th>
                                  <th className="p-2 border-b">Loại hàng</th>
                                  <th className="p-2 border-b">Kho</th>
                                  <th className="p-2 border-b">Điểm kho</th>
                                  <th className="p-2 border-b">Depot</th>
                                  <th className="p-2 border-b">Hạ Cont</th>
                                  <th className="p-2 border-b">Số Cont</th>
                                  <th className="p-2 border-b">SL</th>
                                  <th className="p-2 border-b">20'</th>
                                  <th className="p-2 border-b">40'</th>
                                  <th className="p-2 border-b text-right">Lương</th>
                                  <th className="p-2 border-b text-right">Tiền LH</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               {previewData.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                     <td className="p-2">{row.date}</td>
                                     <td className="p-2 font-bold">{row.driverName}</td>
                                     <td className="p-2">{row.cargoType}</td>
                                     <td className="p-2">{row.warehouse}</td>
                                     <td className="p-2 truncate max-w-[100px]">{row.warehouseLocation}</td>
                                     <td className="p-2">{row.depot}</td>
                                     <td className="p-2">{row.dropReturn}</td>
                                     <td className="p-2">{row.containerNo}</td>
                                     <td className="p-2">{row.quantity}</td>
                                     <td className="p-2">{row.count20}</td>
                                     <td className="p-2">{row.count40}</td>
                                     <td className="p-2 text-right text-blue-600 font-bold">{row.tripSalary.toLocaleString()}</td>
                                     <td className="p-2 text-right text-orange-600 font-bold">{row.handlingFee.toLocaleString()}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>

                      <div className="mt-4 flex justify-end gap-3">
                         <button 
                           onClick={() => setIsImportModalOpen(false)}
                           className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                         >
                           Hủy
                         </button>
                         <button 
                           onClick={saveImport}
                           className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm flex items-center"
                         >
                           <Save size={18} className="mr-2" /> Lưu dữ liệu
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;
