
import React, { useState, useEffect } from 'react';
import { DollarSign, Receipt, Plus, Clock, CheckCircle, XCircle, Search, User, Tag, Copy, Share2, Disc, CircleDot, Truck } from 'lucide-react';
import { Role, DriverExpense, Driver, ExpenseStatus, ExpenseCategory, Vehicle } from '../types';
import { DataService } from '../services/dataService';

interface ExpensesProps {
  role: Role;
}

const Expenses: React.FC<ExpensesProps> = ({ role }) => {
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  
  // Create Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    driverId: '', // Added for Admin selection
    amount: '',
    categoryId: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    // Vehicle info auto-populated
    vehicleId: '',
    trailerId: '',
    // Tire specific fields
    activeTireTab: 'TRACTOR' as 'TRACTOR' | 'TRAILER',
    tractorPositions: [] as number[],
    trailerPositions: [] as number[]
  });

  // Approval Modal State (Admin)
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    expId: string | null;
    driverName: string;
    amount: string;
    category: string;
    reason: string;
    date: string;
    tireInfo?: string; // Display tire info if exists
  }>({
    isOpen: false,
    expId: null,
    driverName: '',
    amount: '',
    category: '',
    reason: '',
    date: '',
    tireInfo: ''
  });

  // Copy Zalo Modal State
  const [copyModal, setCopyModal] = useState<{isOpen: boolean, text: string, title: string}>({
    isOpen: false,
    text: '',
    title: ''
  });

  const currentDriverId = 'd1'; // Mock logged in driver

  const loadData = () => {
    setExpenses(DataService.getDriverExpenses());
    setDrivers(DataService.getDrivers());
    setVehicles(DataService.getVehicles());
    setCategories(DataService.getExpenseCategories());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default driverId when modal opens based on role
  useEffect(() => {
    if (isModalOpen) {
      if (role === 'DRIVER') {
        setFormData(prev => ({ ...prev, driverId: currentDriverId }));
      } else {
        setFormData(prev => ({ ...prev, driverId: '' })); // Admin must select
      }
      // Reset tire state
      setFormData(prev => ({...prev, activeTireTab: 'TRACTOR', tractorPositions: [], trailerPositions: [], vehicleId: '', trailerId: ''}));
    }
  }, [isModalOpen, role]);

  // Auto-populate Vehicle and Trailer when Driver or Date changes
  useEffect(() => {
    if (isModalOpen && formData.driverId && formData.date) {
        const assignment = DataService.getAssignmentDetailsForDriver(formData.driverId, new Date(formData.date));
        setFormData(prev => ({
            ...prev,
            vehicleId: assignment.vehicleId || '',
            trailerId: assignment.trailerId || ''
        }));
    }
  }, [formData.driverId, formData.date, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine Driver ID
    const targetDriverId = role === 'ADMIN' ? formData.driverId : currentDriverId;
    if (!targetDriverId) {
      alert("Vui lòng chọn tài xế");
      return;
    }

    // Find category name
    const selectedCat = categories.find(c => c.id === formData.categoryId);
    const catName = selectedCat ? selectedCat.name : 'Khác';
    const isTireRepair = catName.toLowerCase().includes('vá vỏ') || catName.toLowerCase().includes('lốp');

    // Tire Details validation
    let tireDetails = undefined;
    if (isTireRepair) {
        if (formData.tractorPositions.length === 0 && formData.trailerPositions.length === 0) {
            alert("Vui lòng chọn ít nhất một vị trí vỏ xe (Đầu kéo hoặc Rơ-moóc).");
            return;
        }
        
        const descParts = [];
        if (formData.tractorPositions.length > 0) {
            descParts.push(`Đầu kéo: ${formData.tractorPositions.sort((a,b)=>a-b).join(', ')}`);
        }
        if (formData.trailerPositions.length > 0) {
            descParts.push(`Mooc: ${formData.trailerPositions.sort((a,b)=>a-b).join(', ')}`);
        }

        tireDetails = {
            tractorPositions: formData.tractorPositions,
            trailerPositions: formData.trailerPositions,
            description: descParts.join(' | ')
        };
    }

    // Determine Status
    const initialStatus: ExpenseStatus = role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    DataService.addDriverExpense({
      driverId: targetDriverId,
      amount: Number(formData.amount),
      category: catName,
      reason: formData.reason,
      date: formData.date,
      vehicleId: formData.vehicleId,
      trailerId: formData.trailerId,
      tireDetails: tireDetails
    }, initialStatus);

    // Prepare Zalo Text
    if (role === 'ADMIN') {
        const d = drivers.find(d => d.id === targetDriverId);
        const vehicle = vehicles.find(v => v.id === formData.vehicleId);
        const dateObj = new Date(formData.date);
        const dateStr = `${dateObj.getDate().toString().padStart(2,'0')}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}/${dateObj.getFullYear()}`;
        
        const tireText = tireDetails ? `\n- Vị trí: ${tireDetails.description}` : '';
        const vehicleText = vehicle ? `\n- Xe: ${vehicle.plateNumber}` : '';
        const zaloText = `GHI NHẬN CHI PHÍ\n- Tài xế: ${d?.name}${vehicleText}\n- Số tiền: ${Number(formData.amount).toLocaleString()} đ\n- Hạng mục: ${catName}${tireText}\n- Nội dung: ${formData.reason || 'Không'}\n- Ngày: ${dateStr}\n(Đã được Admin ghi nhận và duyệt)`;
        
        setCopyModal({
            isOpen: true,
            title: 'Đã tạo phiếu chi!',
            text: zaloText
        });
    }

    setFormData({ amount: '', categoryId: '', reason: '', date: new Date().toISOString().split('T')[0], driverId: '', activeTireTab: 'TRACTOR', tractorPositions: [], trailerPositions: [], vehicleId: '', trailerId: '' });
    setIsModalOpen(false);
    loadData();
  };

  const handleOpenApprove = (exp: DriverExpense) => {
    const driver = drivers.find(d => d.id === exp.driverId);
    setApprovalModal({
      isOpen: true,
      expId: exp.id,
      driverName: driver?.name || 'Unknown',
      amount: exp.amount.toString(),
      category: exp.category || '',
      reason: exp.reason || '',
      date: exp.date,
      tireInfo: exp.tireDetails ? exp.tireDetails.description : ''
    });
  };

  const handleConfirmApproval = () => {
    if (!approvalModal.expId) return;

    DataService.updateDriverExpense(approvalModal.expId, {
      amount: Number(approvalModal.amount),
      category: approvalModal.category
    });

    DataService.approveDriverExpense(approvalModal.expId);

    const dateObj = new Date(approvalModal.date);
    const dateStr = `${dateObj.getDate().toString().padStart(2,'0')}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}/${dateObj.getFullYear()}`;
    
    const tireText = approvalModal.tireInfo ? `\n- Vị trí: ${approvalModal.tireInfo}` : '';
    const zaloText = `DUYỆT CHI PHÍ\n- Tài xế: ${approvalModal.driverName}\n- Số tiền: ${Number(approvalModal.amount).toLocaleString()} đ\n- Hạng mục: ${approvalModal.category}${tireText}\n- Nội dung: ${approvalModal.reason || 'Không'}\n- Ngày: ${dateStr}`;

    setApprovalModal(prev => ({ ...prev, isOpen: false }));
    loadData();
    setCopyModal({
      isOpen: true,
      title: 'Đã duyệt phiếu chi!',
      text: zaloText
    });
  };

  const handleReject = (id: string) => {
    if (confirm('Từ chối khoản chi phí này?')) {
      DataService.rejectDriverExpense(id);
      loadData();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(copyModal.text);
    setCopyModal({...copyModal, isOpen: false});
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="flex items-center text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs font-bold"><Clock size={12} className="mr-1"/> Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle size={12} className="mr-1"/> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-bold"><XCircle size={12} className="mr-1"/> Từ chối</span>;
      default:
        return <span className="text-gray-500 text-xs">Không rõ</span>;
    }
  };

  const displayedExpenses = role === 'DRIVER' 
    ? expenses.filter(a => a.driverId === currentDriverId)
    : expenses;

  const pendingCount = expenses.filter(a => a.status === 'PENDING').length;

  const isTireRepairCategory = () => {
    const selectedCat = categories.find(c => c.id === formData.categoryId);
    const catName = selectedCat ? selectedCat.name.toLowerCase() : '';
    return catName.includes('vá vỏ') || catName.includes('lốp');
  };

  // Helper to toggle tire selection
  const toggleTire = (num: number) => {
    setFormData(prev => {
        const isTractor = prev.activeTireTab === 'TRACTOR';
        const currentList = isTractor ? prev.tractorPositions : prev.trailerPositions;
        
        let newList;
        if (currentList.includes(num)) {
            newList = currentList.filter(n => n !== num);
        } else {
            newList = [...currentList, num];
        }
        
        return { 
            ...prev, 
            [isTractor ? 'tractorPositions' : 'trailerPositions']: newList.sort((a,b) => a-b) 
        };
    });
  };

  // --- TIRE VISUALIZER HELPER ---
  const TireIcon = ({ num, isActive, onClick }: {num: number, isActive: boolean, onClick: () => void}) => (
    <div 
        onClick={onClick}
        className={`w-10 h-14 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all shadow-sm ${isActive ? 'bg-primary border-primary text-white scale-110' : 'bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300'}`}
    >
        <span className="text-xs font-bold">{num}</span>
    </div>
  );

  const Axle = ({ tires, currentPositions }: {tires: number[], currentPositions: number[]}) => (
      <div className="flex justify-between items-center w-40 md:w-48 bg-gray-100 rounded-lg p-2 mb-2 border border-gray-300">
          <div className="flex gap-1">
             {tires.slice(0, tires.length/2).map(n => (
                 <TireIcon 
                    key={n} 
                    num={n} 
                    isActive={currentPositions.includes(n)}
                    onClick={() => toggleTire(n)} 
                 />
             ))}
          </div>
          <div className="h-full w-1 bg-gray-400 rounded-full mx-1"></div>
          <div className="flex gap-1">
             {tires.slice(tires.length/2).map(n => (
                 <TireIcon 
                    key={n} 
                    num={n} 
                    isActive={currentPositions.includes(n)}
                    onClick={() => toggleTire(n)} 
                 />
             ))}
          </div>
      </div>
  );

  const renderTireMap = () => {
      const currentPositions = formData.activeTireTab === 'TRACTOR' ? formData.tractorPositions : formData.trailerPositions;
      
      if (formData.activeTireTab === 'TRACTOR') {
          // Tractor: Axle 1 (2 tires), Axle 2 (4 tires), Axle 3 (4 tires)
          return (
              <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Đầu xe (Cabin)</div>
                  {/* Axle 1 (Steer) */}
                  <div className="flex justify-between items-center w-40 md:w-48 bg-gray-100 rounded-lg p-2 mb-4 border border-gray-300">
                      <TireIcon num={1} isActive={currentPositions.includes(1)} onClick={() => toggleTire(1)} />
                      <div className="h-full w-1 bg-gray-400 rounded-full mx-1"></div>
                      <TireIcon num={2} isActive={currentPositions.includes(2)} onClick={() => toggleTire(2)} />
                  </div>
                  {/* Axle 2 (Drive) */}
                  <Axle tires={[3, 4, 5, 6]} currentPositions={currentPositions} />
                  {/* Axle 3 (Drive) */}
                  <Axle tires={[7, 8, 9, 10]} currentPositions={currentPositions} />
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Đuôi xe</div>
              </div>
          )
      } else {
          // Trailer: Typically 3 axles, 4 tires each (Dual) or 2 tires (Super single). 
          // Implementation: 3 Axles, 4 tires each (Total 12) to cover max case.
          return (
             <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Chốt kéo (Kingpin)</div>
                  <div className="h-8"></div>
                  {/* Axle 1 */}
                  <Axle tires={[1, 2, 3, 4]} currentPositions={currentPositions} />
                  {/* Axle 2 */}
                  <Axle tires={[5, 6, 7, 8]} currentPositions={currentPositions} />
                  {/* Axle 3 */}
                  <Axle tires={[9, 10, 11, 12]} currentPositions={currentPositions} />
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Đuôi Mooc</div>
             </div>
          )
      }
  };

  // Filter categories for Expense
  const expenseCategories = categories.filter(c => c.usage === 'EXPENSE' || c.usage === 'BOTH');

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <Receipt className="mr-2" /> Quản lý Chi phí
          </h2>
          <p className="text-gray-500">
            {role === 'ADMIN' 
              ? `Quản lý các khoản tài xế đã chi (${pendingCount} yêu cầu mới).` 
              : 'Báo cáo các khoản chi phí phát sinh trên đường.'}
          </p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm transition-colors"
        >
            <Plus size={18} className="mr-2" /> 
            {role === 'ADMIN' ? 'Tạo phiếu chi hộ' : 'Báo chi mới'}
        </button>
      </header>

      {/* Admin Action Bar / Search Placeholder */}
      {role === 'ADMIN' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center space-x-2 text-gray-500">
             <Search size={20} />
             <span className="text-sm">Hiển thị {displayedExpenses.length} phiếu</span>
           </div>
           {pendingCount > 0 && (
             <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full animate-pulse">
               Cần xử lý: {pendingCount} phiếu
             </span>
           )}
        </div>
      )}

      {/* Main List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-6 py-4">Ngày chi</th>
                {role === 'ADMIN' && <th className="px-6 py-4">Tài xế</th>}
                <th className="px-6 py-4">Xe / Mooc</th>
                <th className="px-6 py-4">Hạng mục / Nội dung</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                {role === 'ADMIN' && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...displayedExpenses].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(exp => {
                const driver = drivers.find(d => d.id === exp.driverId);
                const vehicle = vehicles.find(v => v.id === exp.vehicleId);
                const trailer = vehicles.find(v => v.id === exp.trailerId);
                const dateStr = new Date(exp.date).toLocaleDateString('vi-VN');
                
                return (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">
                      {dateStr}
                    </td>
                    {role === 'ADMIN' && (
                       <td className="px-6 py-4">
                         <div className="flex items-center">
                           <div className="p-1.5 bg-gray-100 rounded-full mr-2">
                             <User size={14} className="text-gray-600"/>
                           </div>
                           <span className="font-medium text-gray-800">{driver?.name || 'Unknown'}</span>
                         </div>
                       </td>
                    )}
                    <td className="px-6 py-4">
                        {vehicle ? (
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 text-xs">{vehicle.plateNumber}</span>
                                {trailer && <span className="text-[10px] text-gray-500">+ {trailer.plateNumber}</span>}
                            </div>
                        ) : (
                            <span className="text-gray-400 text-xs">--</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 flex items-center">
                           <Tag size={12} className="mr-1 text-primary" />
                           {exp.category || 'Khác'}
                        </span>
                        {exp.tireDetails && (
                            <span className="text-xs font-semibold text-blue-600 flex items-center mt-1">
                                <CircleDot size={10} className="mr-1" />
                                {exp.tireDetails.description}
                            </span>
                        )}
                        <span className="text-xs text-gray-500 italic mt-0.5">{exp.reason || 'Không có chi tiết'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      {exp.amount.toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(exp.status)}
                    </td>
                    {role === 'ADMIN' && (
                      <td className="px-6 py-4 text-right">
                         {exp.status === 'PENDING' && (
                           <div className="flex justify-end space-x-2">
                             <button 
                                onClick={() => handleOpenApprove(exp)}
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Duyệt"
                             >
                               <CheckCircle size={18} />
                             </button>
                             <button 
                                onClick={() => handleReject(exp.id)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Từ chối"
                             >
                               <XCircle size={18} />
                             </button>
                           </div>
                         )}
                         {exp.status === 'APPROVED' && <span className="text-xs text-gray-400">Đã duyệt {exp.approvedDate ? new Date(exp.approvedDate).toLocaleDateString('vi-VN') : ''}</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
              {displayedExpenses.length === 0 && (
                <tr><td colSpan={role === 'ADMIN' ? 7 : 6} className="text-center py-12 text-gray-400">Không có phiếu chi nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal (Shared for Driver & Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
             <h3 className="text-lg font-bold mb-4 text-primary-dark">
                {role === 'ADMIN' ? 'Tạo phiếu chi hộ' : 'Báo cáo khoản chi'}
             </h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               {/* Admin: Select Driver */}
               {role === 'ADMIN' && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tài xế chi tiền</label>
                     <select 
                       required
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                       value={formData.driverId}
                       onChange={e => setFormData({...formData, driverId: e.target.value})}
                     >
                       <option value="">-- Chọn tài xế --</option>
                       {drivers.map(d => (
                         <option key={d.id} value={d.id}>{d.name}</option>
                       ))}
                     </select>
                   </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
                     <div className="relative">
                       <input 
                        required
                        type="number" 
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                        placeholder="0"
                       />
                       <DollarSign size={14} className="absolute left-3 top-3 text-gray-400" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Ngày chi</label>
                     <input 
                      required
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                     />
                   </div>
               </div>

               {/* Auto-populated Vehicle Info */}
               {formData.driverId && (
                   <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phương tiện theo phân công</label>
                       <div className="flex items-center text-sm font-medium text-gray-800">
                           <Truck size={16} className="mr-2 text-primary" />
                           {(() => {
                               const v = vehicles.find(veh => veh.id === formData.vehicleId);
                               const t = vehicles.find(veh => veh.id === formData.trailerId);
                               if (!v) return <span className="text-gray-400 italic">Không tìm thấy xe phân công ngày này</span>;
                               return (
                                   <span>
                                       {v.plateNumber}
                                       {t && <span className="text-gray-600 ml-1"> + {t.plateNumber} (Mooc)</span>}
                                   </span>
                               );
                           })()}
                       </div>
                   </div>
               )}
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Hạng mục</label>
                 <select 
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                   value={formData.categoryId}
                   onChange={e => setFormData({...formData, categoryId: e.target.value, tractorPositions: [], trailerPositions: []})}
                 >
                   <option value="">-- Chọn hạng mục --</option>
                   {expenseCategories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>

               {/* TIRE SELECTOR UI */}
               {isTireRepairCategory() && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                      <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-bold text-gray-800 flex items-center">
                              <Disc size={16} className="mr-2 text-primary" /> Chọn vị trí vỏ cần vá/thay
                          </label>
                          <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, activeTireTab: 'TRACTOR'})}
                                className={`px-3 py-1 text-xs font-bold transition-colors flex items-center ${formData.activeTireTab === 'TRACTOR' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                              >
                                  Đầu kéo {(() => {
                                      const v = vehicles.find(x => x.id === formData.vehicleId);
                                      return v ? `(${v.plateNumber})` : '';
                                  })()} {formData.tractorPositions.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${formData.activeTireTab === 'TRACTOR' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>{formData.tractorPositions.length}</span>}
                              </button>
                              <div className="w-[1px] bg-gray-300"></div>
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, activeTireTab: 'TRAILER'})}
                                className={`px-3 py-1 text-xs font-bold transition-colors flex items-center ${formData.activeTireTab === 'TRAILER' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                              >
                                  Rơ-moóc {(() => {
                                      const t = vehicles.find(x => x.id === formData.trailerId);
                                      return t ? `(${t.plateNumber})` : '(N/A)';
                                  })()} {formData.trailerPositions.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${formData.activeTireTab === 'TRAILER' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>{formData.trailerPositions.length}</span>}
                              </button>
                          </div>
                      </div>
                      
                      <div className="flex justify-center p-2 bg-white rounded-lg border border-gray-200 shadow-inner">
                          {renderTireMap()}
                      </div>
                      <div className="text-center mt-2 text-xs text-gray-500 font-medium">
                          {(formData.tractorPositions.length > 0 || formData.trailerPositions.length > 0)
                             ? `Đang chọn: ${[
                                 formData.tractorPositions.length > 0 ? `Đầu kéo (${formData.tractorPositions.sort((a,b)=>a-b).join(',')})` : '',
                                 formData.trailerPositions.length > 0 ? `Mooc (${formData.trailerPositions.sort((a,b)=>a-b).join(',')})` : ''
                               ].filter(Boolean).join(' + ')}` 
                             : 'Vui lòng nhấn vào vị trí vỏ trên hình (Có thể chọn nhiều vỏ ở cả Đầu kéo và Mooc)'}
                      </div>
                  </div>
               )}

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết / Ghi chú</label>
                 <textarea 
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  placeholder="VD: Vá vỏ tại Tiền Giang..."
                 />
               </div>
               <div className="flex justify-end space-x-3 mt-6 pt-2 border-t">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                 >
                   Hủy
                 </button>
                 <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm"
                 >
                   {role === 'ADMIN' ? 'Tạo & Duyệt' : 'Gửi báo cáo'}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Admin Approval Modal */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
             <h3 className="text-lg font-bold mb-4 text-primary-dark">Duyệt Phiếu Chi</h3>
             
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Tài xế:</span>
                  <span className="font-bold text-gray-800">{approvalModal.driverName}</span>
                </div>
                {approvalModal.tireInfo && (
                   <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Vị trí vỏ:</span>
                      <span className="font-bold text-blue-600 text-right">{approvalModal.tireInfo}</span>
                   </div>
                )}
                <div className="flex justify-between">
                   <span className="text-gray-500">Nội dung:</span>
                   <span className="font-medium text-gray-700 italic text-right truncate max-w-[150px]">{approvalModal.reason || 'Không'}</span>
                </div>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền duyệt (VND)</label>
                 <div className="relative">
                   <input 
                    type="number" 
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-primary text-lg"
                    value={approvalModal.amount}
                    onChange={e => setApprovalModal({...approvalModal, amount: e.target.value})}
                   />
                   <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Hạng mục chi</label>
                 <select 
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                   value={categories.find(c => c.name === approvalModal.category)?.id || ''}
                   onChange={e => {
                     const cat = categories.find(c => c.id === e.target.value);
                     setApprovalModal({...approvalModal, category: cat ? cat.name : 'Khác'});
                   }}
                 >
                   {expenseCategories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                   {!expenseCategories.some(c => c.name === approvalModal.category) && (
                     <option value="">{approvalModal.category}</option>
                   )}
                 </select>
               </div>
             </div>

             <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
               <button 
                onClick={() => setApprovalModal({...approvalModal, isOpen: false})}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 Hủy
               </button>
               <button 
                onClick={handleConfirmApproval}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm flex items-center"
               >
                 <CheckCircle size={16} className="mr-2" />
                 Xác nhận Duyệt
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Copy Zalo Modal (Reused Logic) */}
      {copyModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">{copyModal.title}</h3>
            <p className="text-gray-500 text-sm mb-4">Sao chép nội dung bên dưới để gửi qua Zalo</p>
            
            <div className="bg-gray-50 p-4 rounded-lg text-left text-sm font-mono text-gray-700 mb-4 whitespace-pre-wrap border border-gray-200">
              {copyModal.text}
            </div>

            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setCopyModal({...copyModal, isOpen: false})}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
              <button 
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center"
              >
                <Copy size={16} className="mr-2" /> Sao chép
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
