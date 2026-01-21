
import React, { useState, useEffect } from 'react';
import { Tags, Book, FileQuestion, Plus, Trash2, Upload, AlertCircle, Save } from 'lucide-react';
import { Role, ExpenseCategory, PaymentRecipient, PayOnBehalfReason } from '../types';
import { DataService } from '../services/dataService';

interface FinancialCategoryProps {
  role: Role;
  defaultTab?: 'categories' | 'recipients' | 'pob-reasons';
}

const FinancialCategory: React.FC<FinancialCategoryProps> = ({ role, defaultTab = 'categories' }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'recipients' | 'pob-reasons'>(defaultTab);

  // Data States
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
  const [pobReasons, setPobReasons] = useState<PayOnBehalfReason[]>([]);

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [isRecipientImportOpen, setIsRecipientImportOpen] = useState(false);
  const [isPobReasonModalOpen, setIsPobReasonModalOpen] = useState(false);

  // Forms
  const [categoryForm, setCategoryForm] = useState<{ name: string; description: string; usage: 'ADVANCE' | 'EXPENSE' | 'BOTH'; }>({ name: '', description: '', usage: 'BOTH' });
  const [recipientForm, setRecipientForm] = useState({ name: '', type: 'DEPOT' as 'DEPOT' | 'DRIVER' | 'OTHER' });
  const [pobReasonForm, setPobReasonForm] = useState({ name: '' });

  // Import State
  const [importText, setImportText] = useState('');

  const loadData = () => {
    setExpenseCategories(DataService.getExpenseCategories());
    setRecipients(DataService.getPaymentRecipients());
    setPobReasons(DataService.getPayOnBehalfReasons());
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (role !== 'ADMIN') {
    return null;
  }

  // --- Handlers ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addExpenseCategory({ name: categoryForm.name, description: categoryForm.description, usage: categoryForm.usage });
    setCategoryForm({ name: '', description: '', usage: 'BOTH' }); setIsCategoryModalOpen(false); loadData();
  };
  const handleDeleteCategory = (id: string) => { if(confirm('Xóa hạng mục chi này?')) { DataService.deleteExpenseCategory(id); loadData(); } };
  
  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addPaymentRecipient(recipientForm);
    setRecipientForm({ name: '', type: 'DEPOT' }); setIsRecipientModalOpen(false); loadData();
  };
  const handleDeleteRecipient = (id: string) => { if(confirm('Xóa đơn vị nhận tiền này?')) { DataService.deletePaymentRecipient(id); loadData(); } };
  
  const handleAddPobReason = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addPayOnBehalfReason(pobReasonForm);
    setPobReasonForm({ name: '' }); setIsPobReasonModalOpen(false); loadData();
  };
  const handleDeletePobReason = (id: string) => { if(confirm('Xóa lý do này?')) { DataService.deletePayOnBehalfReason(id); loadData(); } };

  const handleImportRecipients = () => {
    if(!importText.trim()) return;
    const lines = importText.split('\n');
    const newItems: any[] = [];
    lines.forEach(line => { if(line.trim()) { newItems.push({ name: line.trim(), type: 'DEPOT' }); } });
    DataService.addPaymentRecipientsBulk(newItems);
    setImportText(''); setIsRecipientImportOpen(false); loadData(); alert(`Đã thêm ${newItems.length} đơn vị.`);
  };

  const getUsageBadge = (usage: 'ADVANCE' | 'EXPENSE' | 'BOTH') => {
    switch (usage) {
      case 'ADVANCE': return <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Phiếu tạm ứng</span>;
      case 'EXPENSE': return <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Tài xế chi</span>;
      default: return <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">Cả hai</span>;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-primary-dark flex items-center">
          <Book className="mr-2" /> Danh mục tài chính
        </h2>
        <p className="text-gray-500">Quản lý các danh mục chi phí, đơn vị nhận tiền và lý do chi.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab('categories')} className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${activeTab === 'categories' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          <Tags size={18} className="mr-2" /> Hạng mục Chi
          {activeTab === 'categories' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        <button onClick={() => setActiveTab('recipients')} className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${activeTab === 'recipients' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          <Book size={18} className="mr-2" /> Đơn vị nhận tiền
          {activeTab === 'recipients' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        <button onClick={() => setActiveTab('pob-reasons')} className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${activeTab === 'pob-reasons' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          <FileQuestion size={18} className="mr-2" /> Lý do chi hộ
          {activeTab === 'pob-reasons' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'categories' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">Danh mục Hạng mục Chi</h3>
                <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm">
                <Plus size={16} className="mr-2" /> Thêm hạng mục
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {expenseCategories.map(cat => (
                <div key={cat.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow bg-gray-50">
                    <div className="flex-1"><div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-gray-800">{cat.name}</h4>{getUsageBadge(cat.usage)}</div><p className="text-xs text-gray-500">{cat.description || 'Không có mô tả'}</p></div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-100 rounded-full"><Trash2 size={18} /></button>
                </div>
                ))}
                {expenseCategories.length === 0 && <div className="col-span-3 text-center text-gray-400 py-8">Chưa có hạng mục nào</div>}
            </div>
            </div>
        )}

        {activeTab === 'recipients' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">Đơn vị nhận tiền (Depot / Cảng / Khác)</h3>
                <div className="flex gap-2">
                    <button onClick={() => setIsRecipientImportOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm"><Upload size={16} className="mr-2" /> Import</button>
                    <button onClick={() => setIsRecipientModalOpen(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm"><Plus size={16} className="mr-2" /> Thêm mới</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {recipients.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center hover:shadow-md transition-shadow bg-gray-50">
                    <div className="flex-1"><h4 className="font-bold text-gray-800 text-sm">{item.name}</h4><p className="text-xs text-gray-500 mt-0.5">{item.type || 'DEPOT'}</p></div>
                    <button onClick={() => handleDeleteRecipient(item.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                </div>
                ))}
                {recipients.length === 0 && <div className="col-span-4 text-center text-gray-400 py-8">Chưa có đơn vị nào</div>}
            </div>
            </div>
        )}

        {activeTab === 'pob-reasons' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">Quản lý Lý do chi hộ</h3>
                <button onClick={() => setIsPobReasonModalOpen(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm"><Plus size={16} className="mr-2" /> Thêm lý do</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {pobReasons.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow bg-gray-50">
                    <div className="flex-1"><h4 className="font-bold text-gray-800 text-sm">{item.name}</h4></div>
                    <button onClick={() => handleDeletePobReason(item.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                </div>
                ))}
                {pobReasons.length === 0 && <div className="col-span-4 text-center text-gray-400 py-8">Chưa có dữ liệu lý do chi hộ</div>}
            </div>
            </div>
        )}
      </div>

      {/* --- MODALS (Reused) --- */}
      {/* Category Modal */}
      {isCategoryModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"><h3 className="text-lg font-bold mb-4 text-gray-800">Thêm Hạng mục Chi</h3><form onSubmit={handleAddCategory} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Tên hạng mục</label><input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="VD: Tiền luật, Ăn uống..."/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Tùy chọn)</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="VD: Chi phí đường bộ..."/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Loại áp dụng</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white" value={categoryForm.usage} onChange={e => setCategoryForm({...categoryForm, usage: e.target.value as any})}><option value="BOTH">Cả hai (Tạm ứng & Chi phí)</option><option value="ADVANCE">Chỉ Phiếu Tạm Ứng</option><option value="EXPENSE">Chỉ Tài Xế Chi (Hóa đơn)</option></select></div><div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Hủy</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Lưu</button></div></form></div></div>}
      {/* Recipient Modal */}
      {isRecipientModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"><h3 className="text-lg font-bold mb-4 text-gray-800">Thêm Đơn vị nhận tiền</h3><form onSubmit={handleAddRecipient} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Tên đơn vị / Depot</label><input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value})} placeholder="VD: Cảng Cát Lái..."/></div><div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={() => setIsRecipientModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Hủy</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Lưu</button></div></form></div></div>}
      {/* Import Recipient Modal */}
      {isRecipientImportOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"><h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center"><Upload size={20} className="mr-2 text-green-600" /> Import Đơn vị nhận tiền</h3><div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800 border border-blue-100"><p className="font-bold flex items-center mb-1"><AlertCircle size={16} className="mr-2"/> Hướng dẫn:</p><p>Nhập danh sách tên các đơn vị, mỗi đơn vị một dòng.</p></div><textarea className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none h-48 font-mono text-sm" placeholder="Cảng Cát Lái&#10;Cảng VICT&#10;Depot Tân Thuận..." value={importText} onChange={e => setImportText(e.target.value)}/><div className="flex justify-end space-x-3 mt-6"><button onClick={() => setIsRecipientImportOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Hủy</button><button onClick={handleImportRecipients} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm flex items-center"><Save size={16} className="mr-2" /> Lưu danh sách</button></div></div></div>}
      {/* POB Reason Modal */}
      {isPobReasonModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"><h3 className="text-lg font-bold mb-4 text-gray-800">Thêm Lý do chi hộ</h3><form onSubmit={handleAddPobReason} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Tên lý do</label><input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={pobReasonForm.name} onChange={e => setPobReasonForm({...pobReasonForm, name: e.target.value})} placeholder="VD: Cược SC, Vé cổng..."/></div><div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={() => setIsPobReasonModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Hủy</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Lưu</button></div></form></div></div>}

    </div>
  );
};

export default FinancialCategory;
