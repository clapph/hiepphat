
import React, { useState, useEffect } from 'react';
import { DollarSign, Wallet, Plus, Clock, CheckCircle, XCircle, Search, User, Tag, Edit2, Copy, Share2 } from 'lucide-react';
import { Role, MoneyAdvance, Driver, AdvanceStatus, ExpenseCategory } from '../types';
import { DataService } from '../services/dataService';

interface AdvancesProps {
  role: Role;
}

const Advances: React.FC<AdvancesProps> = ({ role }) => {
  const [advances, setAdvances] = useState<MoneyAdvance[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  
  // Create Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    driverId: '', // Added for Admin selection
    amount: '',
    categoryId: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Approval Modal State (Admin)
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    advId: string | null;
    driverName: string;
    amount: string;
    category: string;
    reason: string;
    date: string;
  }>({
    isOpen: false,
    advId: null,
    driverName: '',
    amount: '',
    category: '',
    reason: '',
    date: ''
  });

  // Copy Zalo Modal State
  const [copyModal, setCopyModal] = useState<{isOpen: boolean, text: string, title: string}>({
    isOpen: false,
    text: '',
    title: ''
  });

  const currentDriverId = 'd1'; // Mock logged in driver

  const loadData = () => {
    setAdvances(DataService.getMoneyAdvances());
    setDrivers(DataService.getDrivers());
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
    }
  }, [isModalOpen, role]);

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

    // Determine Status: Admin creates -> APPROVED, Driver creates -> PENDING
    const initialStatus: AdvanceStatus = role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    DataService.addMoneyAdvance({
      driverId: targetDriverId,
      amount: Number(formData.amount),
      category: catName,
      reason: formData.reason,
      date: formData.date
    }, initialStatus);

    // Prepare Zalo Text (If Admin creates, allow them to copy to notify driver)
    if (role === 'ADMIN') {
        const d = drivers.find(d => d.id === targetDriverId);
        const dateObj = new Date(formData.date);
        const dateStr = `${dateObj.getDate().toString().padStart(2,'0')}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}/${dateObj.getFullYear()}`;
        
        const zaloText = `CẤP TẠM ỨNG\n- Tài xế: ${d?.name}\n- Số tiền: ${Number(formData.amount).toLocaleString()} đ\n- Hạng mục: ${catName}\n- Lý do: ${formData.reason || 'Không'}\n- Ngày: ${dateStr}\n(Admin đã tạo và duyệt)`;
        
        setCopyModal({
            isOpen: true,
            title: 'Đã tạo phiếu ứng!',
            text: zaloText
        });
    }

    setFormData({ amount: '', categoryId: '', reason: '', date: new Date().toISOString().split('T')[0], driverId: '' });
    setIsModalOpen(false);
    loadData();
  };

  // Open the Approval Modal
  const handleOpenApprove = (adv: MoneyAdvance) => {
    const driver = drivers.find(d => d.id === adv.driverId);
    setApprovalModal({
      isOpen: true,
      advId: adv.id,
      driverName: driver?.name || 'Unknown',
      amount: adv.amount.toString(),
      category: adv.category || '',
      reason: adv.reason || '',
      date: adv.date
    });
  };

  // Confirm Approval (Save & Show Zalo)
  const handleConfirmApproval = () => {
    if (!approvalModal.advId) return;

    // 1. Update Details First (Admin might have changed amount/category)
    DataService.updateMoneyAdvance(approvalModal.advId, {
      amount: Number(approvalModal.amount),
      category: approvalModal.category
    });

    // 2. Approve
    DataService.approveMoneyAdvance(approvalModal.advId);

    // 3. Prepare Zalo Text
    const dateObj = new Date(approvalModal.date);
    const dateStr = `${dateObj.getDate().toString().padStart(2,'0')}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}/${dateObj.getFullYear()}`;
    
    const zaloText = `DUYỆT TẠM ỨNG\n- Tài xế: ${approvalModal.driverName}\n- Số tiền: ${Number(approvalModal.amount).toLocaleString()} đ\n- Hạng mục: ${approvalModal.category}\n- Lý do: ${approvalModal.reason || 'Không'}\n- Ngày: ${dateStr}`;

    // 4. Close Approval Modal, Open Copy Modal, Reload Data
    setApprovalModal(prev => ({ ...prev, isOpen: false }));
    loadData();
    setCopyModal({
      isOpen: true,
      title: 'Đã duyệt phiếu!',
      text: zaloText
    });
  };

  const handleReject = (id: string) => {
    if (confirm('Từ chối khoản tạm ứng này?')) {
      DataService.rejectMoneyAdvance(id);
      loadData();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(copyModal.text);
    setCopyModal({...copyModal, isOpen: false});
  };

  const getStatusBadge = (status: AdvanceStatus) => {
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

  // Filter advances based on role
  const displayedAdvances = role === 'DRIVER' 
    ? advances.filter(a => a.driverId === currentDriverId)
    : advances;

  // Pending count for Admin
  const pendingCount = advances.filter(a => a.status === 'PENDING').length;

  // Filter categories for Advance
  const advanceCategories = categories.filter(c => c.usage === 'ADVANCE' || c.usage === 'BOTH');

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <Wallet className="mr-2" /> Phiếu Tạm Ứng
          </h2>
          <p className="text-gray-500">
            {role === 'ADMIN' 
              ? `Quản lý các khoản tạm ứng (${pendingCount} yêu cầu mới).` 
              : 'Gửi yêu cầu và theo dõi tạm ứng tiền.'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm transition-colors"
        >
          <Plus size={18} className="mr-2" /> 
          {role === 'ADMIN' ? 'Lập phiếu tạm ứng hộ' : 'Tạm ứng mới'}
        </button>
      </header>

      {/* Admin Action Bar / Search Placeholder */}
      {role === 'ADMIN' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center space-x-2 text-gray-500">
             <Search size={20} />
             <span className="text-sm">Hiển thị {displayedAdvances.length} phiếu</span>
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
                <th className="px-6 py-4">Ngày yêu cầu</th>
                {role === 'ADMIN' && <th className="px-6 py-4">Tài xế</th>}
                <th className="px-6 py-4">Hạng mục / Nội dung</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                {role === 'ADMIN' && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...displayedAdvances].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(adv => {
                const driver = drivers.find(d => d.id === adv.driverId);
                const dateStr = new Date(adv.date).toLocaleDateString('vi-VN');
                
                return (
                  <tr key={adv.id} className="hover:bg-gray-50 transition-colors">
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
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 flex items-center">
                           <Tag size={12} className="mr-1 text-primary" />
                           {adv.category || 'Khác'}
                        </span>
                        <span className="text-xs text-gray-500 italic mt-0.5">{adv.reason || 'Không có chi tiết'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {adv.amount.toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(adv.status)}
                    </td>
                    {role === 'ADMIN' && (
                      <td className="px-6 py-4 text-right">
                         {adv.status === 'PENDING' && (
                           <div className="flex justify-end space-x-2">
                             <button 
                                onClick={() => handleOpenApprove(adv)}
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Duyệt"
                             >
                               <CheckCircle size={18} />
                             </button>
                             <button 
                                onClick={() => handleReject(adv.id)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Từ chối"
                             >
                               <XCircle size={18} />
                             </button>
                           </div>
                         )}
                         {adv.status === 'APPROVED' && <span className="text-xs text-gray-400">Đã duyệt {adv.approvedDate ? new Date(adv.approvedDate).toLocaleDateString('vi-VN') : ''}</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
              {displayedAdvances.length === 0 && (
                <tr><td colSpan={role === 'ADMIN' ? 6 : 5} className="text-center py-12 text-gray-400">Không có phiếu tạm ứng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal (Shared Driver/Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
             <h3 className="text-lg font-bold mb-4 text-primary-dark">
                {role === 'ADMIN' ? 'Lập phiếu tạm ứng hộ' : 'Tạo phiếu tạm ứng'}
             </h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               {/* Admin: Select Driver */}
               {role === 'ADMIN' && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tài xế nhận tiền</label>
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

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền cần ứng (VND)</label>
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
                 <label className="block text-sm font-medium text-gray-700 mb-1">Ngày yêu cầu</label>
                 <input 
                  required
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Hạng mục chi</label>
                 <select 
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                   value={formData.categoryId}
                   onChange={e => setFormData({...formData, categoryId: e.target.value})}
                 >
                   <option value="">-- Chọn hạng mục --</option>
                   {advanceCategories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết / Ghi chú</label>
                 <textarea 
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  placeholder="VD: Chi tiết lý do..."
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
                   {role === 'ADMIN' ? 'Tạo & Duyệt' : 'Gửi yêu cầu'}
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
             <h3 className="text-lg font-bold mb-4 text-primary-dark">Duyệt Phiếu Tạm Ứng</h3>
             
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Tài xế:</span>
                  <span className="font-bold text-gray-800">{approvalModal.driverName}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-gray-500">Lý do ban đầu:</span>
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
                 <p className="text-[10px] text-gray-500 mt-1">Admin có thể điều chỉnh số tiền thực duyệt tại đây.</p>
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
                   {advanceCategories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                   {!advanceCategories.some(c => c.name === approvalModal.category) && (
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

export default Advances;
