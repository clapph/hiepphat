
import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Upload, Save, Trash2, Search, Filter, RefreshCw, AlertCircle, FileText, Printer, CheckSquare, Square, X, Briefcase, CheckCircle, Copy, Plus, Minus, AlertTriangle, MapPin, Warehouse, Edit2, DollarSign, List, FileCheck } from 'lucide-react';
import { Role, PayOnBehalf, PaymentRecipient, Driver, PayOnBehalfReason, PayOnBehalfSlip } from '../types';
import { DataService } from '../services/dataService';

// ... existing imports and interfaces
interface PayOnBehalfProps {
  role: Role;
}

interface SlipPreview {
  tempId: string; // Unique ID for the modal list (UI only)
  refId: string; // Reference to the original PayOnBehalf ID
  date: string; // Payment Date
  amount: number; // Actual Payment Amount for this slip
  recipient: string; // The selected value (Name) - ACTUAL
  reason: string; // Generated Reason String
  selectedReasonId: string; // New: Selected Reason from Config
  // Reference Data (Read Only)
  originalReconcile: string;
  originalDepotData: string; // PLAN
  containerType: string; // 20 or 40
  containerNo: string; // For display
  vehiclePlate?: string; // For saving snapshot
}

const PayOnBehalfPage: React.FC<PayOnBehalfProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'originals' | 'slips'>('originals');
  const [items, setItems] = useState<PayOnBehalf[]>([]);
  const [generatedSlipsData, setGeneratedSlipsData] = useState<PayOnBehalfSlip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
  const [pobReasons, setPobReasons] = useState<PayOnBehalfReason[]>([]);
  
  // Filters
  const [filterFromDate, setFilterFromDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [filterToDate, setFilterToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importDuplicates, setImportDuplicates] = useState<string[]>([]); // New: Track duplicates
  const [allowDuplicates, setAllowDuplicates] = useState(false); // New: Confirmation checkbox

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PayOnBehalf | null>(null);

  // Slip Generation Modal State
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slips, setSlips] = useState<SlipPreview[]>([]);
  
  const loadData = () => {
    setItems(DataService.getPayOnBehalf());
    setGeneratedSlipsData(DataService.getPayOnBehalfSlips());
    setDrivers(DataService.getDrivers());
    setRecipients(DataService.getPaymentRecipients());
    setPobReasons(DataService.getPayOnBehalfReasons());
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- DATA PROCESSING ---
  const filteredList = useMemo(() => {
    return items.filter(s => {
        const sDate = s.date.split('T')[0];
        const dateMatch = sDate >= filterFromDate && sDate <= filterToDate;
        
        const vehicleMatch = filterVehicle ? s.vehiclePlate.toLowerCase().includes(filterVehicle.toLowerCase()) : true;
        const warehouseMatch = filterWarehouse ? s.warehouse.toLowerCase().includes(filterWarehouse.toLowerCase()) : true;
        const locationMatch = filterLocation ? s.location.toLowerCase().includes(filterLocation.toLowerCase()) : true;

        return dateMatch && vehicleMatch && warehouseMatch && locationMatch;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items, filterFromDate, filterToDate, filterVehicle, filterWarehouse, filterLocation]);

  const filteredSlips = useMemo(() => {
    return generatedSlipsData.filter(s => {
        const sDate = s.date.split('T')[0];
        const dateMatch = sDate >= filterFromDate && sDate <= filterToDate;
        const vehicleMatch = filterVehicle ? (s.vehiclePlate || '').toLowerCase().includes(filterVehicle.toLowerCase()) : true;
        return dateMatch && vehicleMatch;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Latest slip first
  }, [generatedSlipsData, filterFromDate, filterToDate, filterVehicle]);

  if (role !== 'ADMIN') {
    return <div className="p-8 text-center text-gray-500">Bạn không có quyền truy cập trang này.</div>;
  }

  const handleDelete = (id: string) => {
    if (confirm('Xóa bản ghi dữ liệu gốc này?')) {
      DataService.deletePayOnBehalf(id);
      loadData();
      // Remove from selection if exists
      if (selectedIds.has(id)) {
          const newSet = new Set(selectedIds);
          newSet.delete(id);
          setSelectedIds(newSet);
      }
    }
  };

  const handleDeleteSlip = (id: string) => {
    if(confirm('Xóa phiếu chi này? (Dữ liệu gốc sẽ không bị xóa)')) {
        DataService.deletePayOnBehalfSlip(id);
        loadData();
    }
  }

  const handleEditClick = (item: PayOnBehalf) => {
      setEditingItem({...item});
      setIsEditModalOpen(true);
  };

  const handleUpdateSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingItem) return;
      DataService.updatePayOnBehalf(editingItem.id, editingItem);
      setIsEditModalOpen(false);
      setEditingItem(null);
      loadData();
      alert('Đã cập nhật thông tin thành công!');
  };

  const toggleSelectAll = (filteredItems: PayOnBehalf[]) => {
      if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredItems.map(i => i.id)));
      }
  };

  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const generateReasonString = (
      typeCode: string, cont: string, plate: string, opDate: string, reconcile: string, selectedReasonName: string
  ) => {
      let base = `${typeCode} ${cont} ${plate} ${opDate}`;
      if (selectedReasonName) { return `${selectedReasonName}: ${base} ${reconcile}`.trim(); }
      return `${base} ${reconcile}`.trim();
  };

  const handleGenerateSlips = () => {
      if (selectedIds.size === 0) { alert("Vui lòng chọn ít nhất một dòng dữ liệu gốc để tạo phiếu."); return; }
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      const todayStr = new Date().toISOString().split('T')[0];
      const generatedSlips: SlipPreview[] = selectedItems.map(item => {
          let amount = 0;
          if (item.customerReconciliation) {
             const clean = item.customerReconciliation.replace(/\./g, '').replace(/,/g, '').replace(/\D/g, ''); 
             if (clean) amount = parseInt(clean);
          }
          const op = item.operation ? item.operation.toLowerCase() : '';
          const typeCode = op.includes('nhập') ? 'HR' : (op.includes('xuất') ? 'LR' : item.operation);
          const cont = item.containerNo || '';
          const plate = item.vehiclePlate || '';
          const opDate = new Date(item.date).toLocaleDateString('vi-VN');
          const reconcile = item.customerReconciliation || '';
          const reason = generateReasonString(typeCode, cont, plate, opDate, reconcile, '');
          let planRecipient = '';
          if (op.includes('nhập')) { planRecipient = item.dropReturn || ''; } else if (op.includes('xuất')) { planRecipient = item.depot || ''; } else { planRecipient = item.depot || item.dropReturn || item.warehouse || ''; }
          let contType = '';
          if (item.count20 && item.count20 > 0) contType = "20'";
          else if (item.count40 && item.count40 > 0) contType = "40'";
          return {
              tempId: Math.random().toString(36).substr(2, 9),
              refId: item.id,
              date: todayStr, 
              amount: amount,
              recipient: planRecipient, 
              reason: reason,
              selectedReasonId: '', 
              originalReconcile: item.customerReconciliation,
              originalDepotData: planRecipient, 
              containerType: contType,
              containerNo: item.containerNo || 'N/A',
              vehiclePlate: item.vehiclePlate
          };
      });
      setSlips(generatedSlips);
      setIsSlipModalOpen(true);
  };

  const updateSlipReason = (slip: SlipPreview, newReasonId: string) => {
      const item = items.find(i => i.id === slip.refId);
      if (!item) return slip.reason;
      const op = item.operation ? item.operation.toLowerCase() : '';
      const typeCode = op.includes('nhập') ? 'HR' : (op.includes('xuất') ? 'LR' : item.operation);
      const opDate = new Date(item.date).toLocaleDateString('vi-VN');
      const reasonName = pobReasons.find(r => r.id === newReasonId)?.name || '';
      return generateReasonString(typeCode, item.containerNo || '', item.vehiclePlate || '', opDate, item.customerReconciliation || '', reasonName);
  };

  const addSlipRow = (index: number) => {
      const sourceSlip = slips[index];
      const newSlip: SlipPreview = {
          ...sourceSlip,
          tempId: Math.random().toString(36).substr(2, 9),
          amount: 0, 
          selectedReasonId: '', 
          reason: updateSlipReason({ ...sourceSlip, selectedReasonId: '' } as any, '')
      };
      const newSlips = [...slips];
      newSlips.splice(index + 1, 0, newSlip); 
      setSlips(newSlips);
  };

  const removeSlipRow = (index: number) => {
      const newSlips = [...slips];
      newSlips.splice(index, 1);
      setSlips(newSlips);
  };

  const handlePrintSlips = () => {
      const slipRecords: Omit<PayOnBehalfSlip, 'id' | 'createdAt'>[] = slips.map(s => ({
          refId: s.refId,
          date: s.date,
          amount: s.amount,
          recipient: s.recipient,
          reason: s.reason,
          containerNo: s.containerNo,
          vehiclePlate: s.vehiclePlate
      }));
      DataService.createPayOnBehalfSlips(slipRecords);
      let advanceCount = 0;
      slips.forEach(slip => {
          const driver = drivers.find(d => d.name === slip.recipient);
          if (driver && slip.amount > 0) {
              DataService.addMoneyAdvance({
                  driverId: driver.id,
                  amount: slip.amount,
                  date: slip.date, 
                  category: 'Chi hộ', 
                  reason: `Chi hộ: ${slip.reason}`
              }, 'APPROVED'); 
              advanceCount++;
          }
      });
      let msg = `Đã tạo ${slips.length} phiếu chi vào bảng dữ liệu riêng!`;
      if (advanceCount > 0) { msg += `\nĐã tự động tạo ${advanceCount} phiếu tạm ứng cho tài xế.`; }
      alert(msg);
      setIsSlipModalOpen(false);
      setSelectedIds(new Set()); 
      setActiveTab('slips'); 
      loadData(); 
  };

  // ... (Parsing logic similar to previous but omitted for brevity as it's not changed) ...
  const parseImportText = () => {
    if (!importText.trim()) { alert("Vui lòng dán dữ liệu vào ô trống."); return; }
    const lines = importText.split('\n');
    const parsed: any[] = [];
    const errors: string[] = [];
    const duplicateConts: string[] = [];
    const existingContainerNos = new Set(items.map(i => i.containerNo));
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const cols = line.split('\t').map(c => c.trim());
      if (cols.length < 12) { errors.push(`Dòng ${index + 1}: Thiếu cột (Tìm thấy ${cols.length}/12 cột)`); return; }
      const parseNum = (str: string) => { if (!str) return 0; const clean = str.replace(/\D/g, ''); const num = Number(clean); return isNaN(num) ? 0 : num; };
      const parseDate = (str: string) => { if (!str) return new Date().toISOString(); if (str.includes('/')) { const parts = str.split('/'); if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`; } return str; }
      const containerNo = cols[9];
      if (containerNo && existingContainerNos.has(containerNo)) { duplicateConts.push(containerNo); }
      parsed.push({
        vehiclePlate: cols[0], date: parseDate(cols[1]), operation: cols[2], warehouse: cols[3], depot: cols[4], location: cols[5], dropReturn: cols[6],
        count20: parseNum(cols[7]), count40: parseNum(cols[8]), containerNo: containerNo, bookingDo: cols[10], customerReconciliation: cols[11]
      });
    });
    setPreviewData(parsed);
    setImportErrors(errors);
    setImportDuplicates(duplicateConts);
    setAllowDuplicates(false); 
  };

  const saveImport = () => {
    if (previewData.length === 0) return;
    if (importDuplicates.length > 0 && !allowDuplicates) { alert("Vui lòng xác nhận cho phép nhập các Container trùng lặp."); return; }
    DataService.addPayOnBehalfBulk(previewData);
    setImportText('');
    setPreviewData([]);
    setImportErrors([]);
    setImportDuplicates([]);
    setIsImportModalOpen(false);
    loadData();
    alert(`Đã nhập thành công ${previewData.length} dòng!`);
  };

  const resetFilters = () => {
      const date = new Date();
      setFilterFromDate(new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]);
      setFilterToDate(new Date().toISOString().split('T')[0]);
      setFilterVehicle('');
      setFilterWarehouse('');
      setFilterLocation('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <CreditCard className="mr-2" /> Quản lý Chi hộ
          </h2>
          <p className="text-gray-500">Đối chiếu dữ liệu gốc và quản lý các phiếu chi thực tế.</p>
        </div>
        <div className="flex gap-2">
            {activeTab === 'originals' && (
                <>
                    <button 
                        onClick={handleGenerateSlips}
                        className="flex items-center bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 shadow-sm transition-colors"
                    >
                        <FileText size={18} className="mr-2" /> Lập Phiếu ({selectedIds.size})
                    </button>
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors"
                    >
                        <Upload size={18} className="mr-2" /> Import Dữ liệu
                    </button>
                </>
            )}
        </div>
      </header>

      {/* Tabs and Filters remain similar */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('originals')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center ${
            activeTab === 'originals' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={16} className="mr-2"/> Dữ liệu Đối chiếu (Gốc)
          {activeTab === 'originals' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        <button
          onClick={() => setActiveTab('slips')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center ${
            activeTab === 'slips' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
           <FileCheck size={16} className="mr-2"/> Lịch sử Phiếu Chi
          {activeTab === 'slips' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
      </div>

      {/* Filter Bar Code */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
         {/* ... (Filter Inputs) ... */}
         <div className="flex flex-col gap-3 w-full md:w-auto flex-1">
             <div className="flex items-center gap-2 text-primary font-bold">
                <Filter size={16} /> Bộ lọc:
             </div>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                 <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Biển số xe</label>
                    <input 
                        type="text" 
                        placeholder="Tìm BS xe..."
                        className="border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                        value={filterVehicle}
                        onChange={e => setFilterVehicle(e.target.value)}
                    />
                 </div>
                 {activeTab === 'originals' && (
                     <>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Kho Đóng/Nhập</label>
                            <input 
                                type="text" 
                                placeholder="Tìm kho..."
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                                value={filterWarehouse}
                                onChange={e => setFilterWarehouse(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Địa điểm</label>
                            <input 
                                type="text" 
                                placeholder="Tìm địa điểm..."
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                                value={filterLocation}
                                onChange={e => setFilterLocation(e.target.value)}
                            />
                        </div>
                     </>
                 )}
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
            <div className="flex gap-4">
                {activeTab === 'originals' ? (
                    <div className="text-right border-l pl-6 border-gray-200">
                        <p className="text-xs text-gray-500 font-bold uppercase">Dòng dữ liệu</p>
                        <p className="text-lg font-bold text-primary">{filteredList.length}</p>
                    </div>
                ) : (
                    <div className="text-right border-l pl-6 border-gray-200">
                        <p className="text-xs text-gray-500 font-bold uppercase">Tổng tiền chi</p>
                        <p className="text-lg font-bold text-orange-600">{filteredSlips.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* DATA TABLE: ORIGINALS */}
      {activeTab === 'originals' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase">
                <tr>
                    <th className="px-4 py-3 text-center">
                        <button onClick={() => toggleSelectAll(filteredList)} className="hover:text-primary">
                            {selectedIds.size === filteredList.length && filteredList.length > 0 ? <CheckSquare size={16}/> : <Square size={16}/>}
                        </button>
                    </th>
                    <th className="px-4 py-3">Ngày VC</th>
                    <th className="px-4 py-3">BS Xe</th>
                    <th className="px-4 py-3">Tác nghiệp</th>
                    <th className="px-4 py-3">Kho Đóng/Nhập</th>
                    <th className="px-4 py-3">DEPOT LR/FULL</th>
                    <th className="px-4 py-3">Địa điểm</th> 
                    <th className="px-4 py-3">Hạ/Trả</th>
                    <th className="px-4 py-3">Số Cont</th>
                    <th className="px-4 py-3 text-center">20'</th>
                    <th className="px-4 py-3 text-center">40'</th>
                    <th className="px-4 py-3 text-right">Đối chiếu KH</th> 
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredList.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    // Updated Row Coloring Logic
                    const rowClass = `hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${item.hasSlipGenerated ? 'bg-green-50/80 border-l-4 border-l-green-500' : ''}`;
                    
                    return (
                    <tr key={item.id} className={rowClass}>
                        <td className="px-4 py-3 text-center">
                            <button onClick={() => toggleSelect(item.id)} className={isSelected ? 'text-primary' : 'text-gray-400'}>
                                {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                            </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-medium">
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800">{item.vehiclePlate}</td>
                        <td className="px-4 py-3">{item.operation}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={item.warehouse}>{item.warehouse}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={item.depot}>{item.depot}</td>
                        <td className="px-4 py-3 truncate max-w-[150px] text-blue-600" title={item.location}>{item.location}</td>
                        <td className="px-4 py-3">{item.dropReturn}</td>
                        <td className="px-4 py-3 font-mono">{item.containerNo}</td>
                        <td className="px-4 py-3 text-center font-bold">{item.count20 || ''}</td>
                        <td className="px-4 py-3 text-center font-bold">{item.count40 || ''}</td>
                        <td className="px-4 py-3 text-right text-gray-500 italic max-w-[120px] truncate" title={item.customerReconciliation}>
                        {item.customerReconciliation}
                        </td>
                        <td className="px-4 py-3 text-center">
                            {item.hasSlipGenerated ? (
                                <span className="inline-flex items-center text-green-700 bg-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                                    <CheckCircle size={10} className="mr-1"/> Đã lập phiếu
                                </span>
                            ) : (
                                <span className="text-gray-400 text-[10px]">Chưa lập</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                            <button onClick={() => handleEditClick(item)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Sửa dữ liệu gốc">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Xóa dữ liệu gốc">
                                <Trash2 size={14} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    );
                })}
                {filteredList.length === 0 && (
                    <tr><td colSpan={14} className="text-center py-12 text-gray-400">Không có dữ liệu phù hợp</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </div>
      )}

      {/* ... (Keep existing SLIPS Table, Edit Modal, Slip Gen Modal, Import Modal) ... */}
      {/* DATA TABLE: SLIPS (No changes here, keeping context) */}
      {activeTab === 'slips' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase">
                <tr>
                    <th className="px-4 py-3 bg-blue-50 text-blue-800">Ngày Chi</th>
                    <th className="px-4 py-3 bg-blue-50 text-blue-800 text-right">Số Tiền</th>
                    <th className="px-4 py-3 bg-blue-50 text-blue-800">Người nhận</th>
                    <th className="px-4 py-3 bg-blue-50 text-blue-800">Lý do/ND</th>
                    
                    <th className="px-4 py-3">BS Xe</th>
                    <th className="px-4 py-3">Ngày VC (Gốc)</th>
                    <th className="px-4 py-3">Tác nghiệp</th>
                    <th className="px-4 py-3">Số Cont</th>
                    <th className="px-4 py-3">Kho</th>
                    <th className="px-4 py-3">Depot</th>
                    <th className="px-4 py-3">Địa điểm</th>
                    <th className="px-4 py-3">Hạ/Trả</th>
                    <th className="px-4 py-3">Booking/DO</th>
                    <th className="px-4 py-3 text-right">Đối chiếu KH</th>
                    
                    <th className="px-4 py-3 text-center">Xóa</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredSlips.map(slip => {
                    const org = items.find(i => i.id === slip.refId);
                    
                    return (
                        <tr key={slip.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-blue-700 bg-blue-50/20">
                                {new Date(slip.date).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-4 py-3 font-bold text-red-600 text-right bg-blue-50/20">
                                {slip.amount.toLocaleString()} đ
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-800 bg-blue-50/20">
                                {slip.recipient}
                            </td>
                            <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate bg-blue-50/20" title={slip.reason}>
                                {slip.reason}
                            </td>

                            <td className="px-4 py-3 font-bold">{slip.vehiclePlate}</td>
                            <td className="px-4 py-3 text-gray-500">
                                {org ? new Date(org.date).toLocaleDateString('vi-VN') : '-'}
                            </td>
                            <td className="px-4 py-3">{org?.operation || '-'}</td>
                            <td className="px-4 py-3 font-mono">{slip.containerNo}</td>
                            <td className="px-4 py-3 truncate max-w-[100px]" title={org?.warehouse}>{org?.warehouse || '-'}</td>
                            <td className="px-4 py-3 truncate max-w-[100px]" title={org?.depot}>{org?.depot || '-'}</td>
                            <td className="px-4 py-3 truncate max-w-[100px]" title={org?.location}>{org?.location || '-'}</td>
                            <td className="px-4 py-3">{org?.dropReturn || '-'}</td>
                            <td className="px-4 py-3 font-mono">{org?.bookingDo || '-'}</td>
                            <td className="px-4 py-3 text-right italic text-gray-500 truncate max-w-[120px]" title={org?.customerReconciliation}>
                                {org?.customerReconciliation || '-'}
                            </td>

                            <td className="px-4 py-3 text-center">
                                <button onClick={() => handleDeleteSlip(slip.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                    <Trash2 size={14} />
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {filteredSlips.length === 0 && (
                    <tr><td colSpan={15} className="text-center py-12 text-gray-400">Chưa có phiếu chi nào</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </div>
      )}

      {/* ... (Existing modals logic) ... */}
      {isEditModalOpen && editingItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                          <Edit2 size={24} className="mr-2 text-blue-600" /> Cập nhật dữ liệu gốc
                      </h3>
                      <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleUpdateSave} className="space-y-4">
                      {/* ... (Keep form fields) ... */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày vận chuyển</label>
                              <input 
                                  type="date" 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editingItem.date.split('T')[0]} 
                                  onChange={e => setEditingItem({...editingItem, date: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Biển số xe</label>
                              <input 
                                  type="text" 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editingItem.vehiclePlate}
                                  onChange={e => setEditingItem({...editingItem, vehiclePlate: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tác nghiệp</label>
                              <input 
                                  type="text" 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editingItem.operation}
                                  onChange={e => setEditingItem({...editingItem, operation: e.target.value})}
                              />
                          </div>
                      </div>
                      {/* ... rest of the form ... */}
                      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                          <button 
                              type="button"
                              onClick={() => setIsEditModalOpen(false)}
                              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                              Hủy
                          </button>
                          <button 
                              type="submit"
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm flex items-center"
                          >
                              <Save size={18} className="mr-2" /> Lưu thay đổi
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
      {/* ... (Keep other modals: Slip Gen, Import) ... */}
      {isSlipModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-[1400px] w-full p-6 h-[90vh] flex flex-col animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                          <FileText size={24} className="mr-2 text-orange-600" /> Tạo Phiếu Chi (Chi tiết)
                      </h3>
                      <button onClick={() => setIsSlipModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                          <X size={24} />
                      </button>
                  </div>

                  {/* SUMMARY SECTION MOVED TO TOP CENTER */}
                  <div className="flex justify-center mb-4">
                      <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-200 flex items-center shadow-sm">
                          <span className="text-gray-600 font-medium mr-2">Tổng cộng:</span>
                          <span className="font-bold text-gray-900 text-lg">{slips.length} phiếu</span>
                          <div className="h-6 w-[1px] bg-blue-300 mx-4"></div>
                          <span className="text-gray-600 font-medium mr-2">Tổng tiền:</span>
                          <span className="font-bold text-2xl text-primary">{slips.reduce((acc, s) => acc + s.amount, 0).toLocaleString()} đ</span>
                      </div>
                  </div>

                  {/* ... (Slip Table in Modal) ... */}
                  <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                              <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
                                  <tr>
                                      <th className="p-2 border-b w-8 text-center">#</th>
                                      <th className="p-2 border-b w-24">Ngày Chi</th>
                                      <th className="p-2 border-b w-16 text-center">Cont</th>
                                      <th className="p-2 border-b w-24">Số Cont</th>
                                      <th className="p-2 border-b w-32 bg-blue-50">Lý do chi</th>
                                      <th className="p-2 border-b w-24 bg-yellow-50 text-right font-bold text-red-600">Số tiền chi</th>
                                      <th className="p-2 border-b w-32">Nơi nhận (Kế hoạch)</th>
                                      <th className="p-2 border-b w-32">Nơi nhận (Thực tế)</th>
                                      <th className="p-2 border-b w-48">Nội dung (In phiếu)</th>
                                      <th className="p-2 border-b w-16 text-center">Thêm/Bớt</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {slips.map((slip, index) => (
                                      <tr key={slip.tempId} className="hover:bg-gray-50">
                                          <td className="p-2 text-center text-gray-400">{index + 1}</td>
                                          <td className="p-2">
                                              <input 
                                                  type="date"
                                                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                                                  value={slip.date}
                                                  onChange={(e) => {
                                                      setSlips(prev => prev.map(s => s.tempId === slip.tempId ? { ...s, date: e.target.value } : s));
                                                  }}
                                              />
                                          </td>
                                          <td className="p-2 text-center font-bold">{slip.containerType}</td>
                                          <td className="p-2 font-mono text-gray-700">{slip.containerNo}</td>
                                          <td className="p-2 bg-blue-50">
                                              <select 
                                                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none bg-white"
                                                  value={slip.selectedReasonId}
                                                  onChange={(e) => {
                                                      const newId = e.target.value;
                                                      setSlips(prev => prev.map(s => {
                                                          if (s.tempId === slip.tempId) {
                                                              const updatedReason = updateSlipReason(s, newId);
                                                              return { ...s, selectedReasonId: newId, reason: updatedReason };
                                                          }
                                                          return s;
                                                      }));
                                                  }}
                                              >
                                                  <option value="">-- Mặc định --</option>
                                                  {pobReasons.map(r => (
                                                      <option key={r.id} value={r.id}>{r.name}</option>
                                                  ))}
                                              </select>
                                          </td>
                                          <td className="p-2 bg-yellow-50">
                                              <input 
                                                  type="number" 
                                                  className="w-full border border-yellow-300 rounded px-2 py-1 focus:ring-1 focus:ring-yellow-500 outline-none text-right font-bold text-red-600"
                                                  value={slip.amount}
                                                  onFocus={(e) => e.target.select()}
                                                  onChange={(e) => {
                                                      const val = Number(e.target.value);
                                                      setSlips(prev => prev.map(s => s.tempId === slip.tempId ? { ...s, amount: val } : s));
                                                  }}
                                              />
                                          </td>
                                          <td className="p-2 text-gray-500 italic truncate max-w-[120px]">{slip.originalDepotData}</td>
                                          <td className="p-2">
                                              <select 
                                                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none bg-white font-medium text-gray-800"
                                                  value={slip.recipient}
                                                  onChange={(e) => {
                                                      setSlips(prev => prev.map(s => s.tempId === slip.tempId ? { ...s, recipient: e.target.value } : s));
                                                  }}
                                              >
                                                  <option value="">-- Chọn --</option>
                                                  {slip.originalDepotData && <option value={slip.originalDepotData}>{slip.originalDepotData} (Gợi ý)</option>}
                                                  <optgroup label="Depot / Đơn vị">
                                                      {recipients.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                  </optgroup>
                                                  <optgroup label="Tài xế">
                                                      {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                                  </optgroup>
                                              </select>
                                          </td>
                                          <td className="p-2">
                                              <input 
                                                  type="text" 
                                                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none text-xs"
                                                  value={slip.reason}
                                                  onChange={(e) => {
                                                      setSlips(prev => prev.map(s => s.tempId === slip.tempId ? { ...s, reason: e.target.value } : s));
                                                  }}
                                              />
                                          </td>
                                          <td className="p-2 text-center">
                                              <div className="flex justify-center gap-1">
                                                  <button onClick={() => addSlipRow(index)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Plus size={14} /></button>
                                                  <button onClick={() => removeSlipRow(index)} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" disabled={slips.length <= 1}><Minus size={14} /></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  
                  <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button onClick={() => setIsSlipModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                      <button onClick={handlePrintSlips} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold shadow-sm flex items-center">
                          <Printer size={18} className="mr-2" /> Xác nhận & In Phiếu
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* ... (Import Modal) ... */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full p-6 h-[90vh] flex flex-col">
             {/* ... (Import Content Same as before) ... */}
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                   <Upload size={24} className="mr-2 text-green-600" /> Import Dữ liệu Chi hộ
                </h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-gray-500 hover:text-gray-700">Đóng</button>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col gap-4">
                {previewData.length === 0 ? (
                   <div className="flex-1 flex flex-col">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 text-sm text-blue-800">
                         <p className="font-bold mb-1 flex items-center"><AlertCircle size={16} className="mr-2"/> Hướng dẫn:</p>
                         <p>1. Copy dữ liệu từ File Excel hoặc Google Sheet (Bao gồm <strong>12 cột</strong> theo thứ tự: BS Xe, Ngày VC, Tác nghiệp, Kho, Depot, <strong>Địa điểm</strong>, Hạ/Trả, SL 20, SL 40, Số Cont, Số BK/DO, Đối chiếu KH).</p>
                         <p>2. Dán (Paste) vào ô bên dưới.</p>
                         <p>3. Nhấn "Xem trước" để kiểm tra.</p>
                      </div>
                      <textarea className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-xs" placeholder="Dán dữ liệu vào đây..." value={importText} onChange={e => setImportText(e.target.value)} />
                      <div className="mt-4 flex justify-end">
                         <button onClick={parseImportText} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">Xem trước dữ liệu</button>
                      </div>
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                         <p className="text-sm text-gray-600">Đã tìm thấy <strong className="text-primary">{previewData.length}</strong> dòng hợp lệ.</p>
                         <button onClick={() => { setPreviewData([]); setImportErrors([]); setImportDuplicates([]); setAllowDuplicates(false); }} className="text-sm text-blue-600 hover:underline">Quay lại / Nhập lại</button>
                      </div>
                      {importErrors.length > 0 && (
                         <div className="bg-red-50 p-2 rounded-lg border border-red-100 mb-2 max-h-24 overflow-y-auto text-xs text-red-700">
                            <strong>Lỗi định dạng:</strong>
                            <ul className="list-disc pl-4">{importErrors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                         </div>
                      )}
                      {importDuplicates.length > 0 && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-2 animate-fade-in">
                              <div className="flex items-start">
                                  <AlertTriangle className="text-yellow-600 mr-2 flex-shrink-0" size={20} />
                                  <div className="flex-1">
                                      <p className="text-sm font-bold text-yellow-800 mb-1">Cảnh báo: Phát hiện {importDuplicates.length} số Container đã tồn tại!</p>
                                      <div className="flex items-center">
                                          <input type="checkbox" id="allowDuplicates" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" checked={allowDuplicates} onChange={e => setAllowDuplicates(e.target.checked)}/>
                                          <label htmlFor="allowDuplicates" className="ml-2 text-sm font-bold text-yellow-900 cursor-pointer">Tôi xác nhận muốn nhập đè / cho phép trùng lặp</label>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                         <table className="w-full text-xs text-left whitespace-nowrap">
                            <thead className="bg-gray-100 text-gray-700 sticky top-0">
                               <tr><th className="p-2 border-b">BS Xe</th><th className="p-2 border-b">Ngày VC</th><th className="p-2 border-b">Tác nghiệp</th><th className="p-2 border-b">Kho Đóng/Nhập</th><th className="p-2 border-b">Depot</th><th className="p-2 border-b">Địa điểm</th><th className="p-2 border-b">Hạ/Trả</th><th className="p-2 border-b">Số Cont</th><th className="p-2 border-b">BK/DO</th><th className="p-2 border-b text-center">20'</th><th className="p-2 border-b text-center">40'</th><th className="p-2 border-b text-right">Đối chiếu KH</th><th className="p-2 border-b text-right">Số tiền (Gốc)</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               {previewData.map((row, idx) => (
                                  <tr key={idx} className={`hover:bg-gray-50 ${importDuplicates.includes(row.containerNo) ? 'bg-yellow-50' : ''}`}>
                                     <td className="p-2 font-bold">{row.vehiclePlate}</td><td className="p-2">{row.date}</td><td className="p-2">{row.operation}</td><td className="p-2 truncate max-w-[100px]">{row.warehouse}</td><td className="p-2 truncate max-w-[100px]">{row.depot}</td><td className="p-2 truncate max-w-[100px] text-blue-600">{row.location}</td><td className="p-2">{row.dropReturn}</td><td className="p-2 font-mono">{row.containerNo}</td><td className="p-2 font-mono">{row.bookingDo}</td><td className="p-2 text-center">{row.count20}</td><td className="p-2 text-center">{row.count40}</td><td className="p-2 text-right">{row.customerReconciliation}</td><td className="p-2 text-right text-gray-400">{row.amount > 0 ? row.amount.toLocaleString() : '-'}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                      <div className="mt-4 flex justify-end gap-3">
                         <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                         <button onClick={saveImport} disabled={importDuplicates.length > 0 && !allowDuplicates} className={`px-6 py-2 text-white rounded-lg font-bold shadow-sm flex items-center ${importDuplicates.length > 0 && !allowDuplicates ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}><Save size={18} className="mr-2" /> Lưu dữ liệu</button>
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

export default PayOnBehalfPage;
