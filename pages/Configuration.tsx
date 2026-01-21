
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Clock, Truck, Users as UsersIcon, Bell, Calendar } from 'lucide-react';
import { Role, Announcement } from '../types';
import { DataService } from '../services/dataService';
import Resources from './Resources';
import Users from './Users';

interface ConfigurationProps {
  role: Role;
  defaultTab?: 'resources' | 'users' | 'announcements';
}

const Configuration: React.FC<ConfigurationProps> = ({ role, defaultTab = 'resources' }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'users' | 'announcements'>(defaultTab);
  
  // Data States
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Modals
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // Forms
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', validUntil: '', priority: 'normal' as 'normal' | 'high' });

  const loadData = () => {
    setAnnouncements(DataService.getAnnouncements());
  };

  useEffect(() => {
    loadData();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setAnnouncementForm(prev => ({...prev, validUntil: nextWeek.toISOString().split('T')[0]}));
  }, []);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (role !== 'ADMIN') {
    return null;
  }

  // --- Handlers ---
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addAnnouncement({ title: announcementForm.title, content: announcementForm.content, validUntil: announcementForm.validUntil, priority: announcementForm.priority });
    setAnnouncementForm({ title: '', content: '', priority: 'normal', validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] });
    setIsAnnouncementModalOpen(false); loadData();
  };
  const handleDeleteAnnouncement = (id: string) => { if(confirm('Xóa thông báo này?')) { DataService.deleteAnnouncement(id); loadData(); } };

  // Tab Item Component
  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-5 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${
        activeTab === id ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon size={18} className="mr-2" /> {label}
      {activeTab === id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
    </button>
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-primary-dark flex items-center">
          <Settings className="mr-2" /> Quản lý hệ thống
        </h2>
        <p className="text-gray-500">Cấu hình tài nguyên nhân sự, tài khoản và thông báo hệ thống.</p>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <TabButton id="resources" label="Tài xế & Xe" icon={Truck} />
        <TabButton id="users" label="Tài khoản" icon={UsersIcon} />
        <TabButton id="announcements" label="Thông báo" icon={Bell} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="animate-fade-in min-h-[500px]">
            {activeTab === 'resources' && <div className="animate-fade-in"><Resources role={role} /></div>}
            {activeTab === 'users' && <div className="animate-fade-in"><Users role={role} /></div>}
            
            {activeTab === 'announcements' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Quản lý Thông báo</h3>
                    <button onClick={() => setIsAnnouncementModalOpen(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm">
                    <Plus size={16} className="mr-2" /> Tạo thông báo
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(item => {
                    const isExpired = new Date(item.validUntil) < new Date();
                    return (
                        <div key={item.id} className={`border rounded-lg p-4 flex justify-between items-start transition-shadow hover:shadow-md ${isExpired ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex-1">
                            <div className="flex items-center mb-1">
                                {item.priority === 'high' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded mr-2 uppercase">Quan trọng</span>}
                                <h4 className={`font-bold ${isExpired ? 'text-gray-500' : 'text-gray-800'}`}>{item.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{item.content}</p>
                            <div className="flex items-center text-xs text-gray-400 gap-4">
                                <span className="flex items-center"><Calendar size={12} className="mr-1"/> Tạo ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                <span className={`flex items-center ${isExpired ? 'text-red-400' : 'text-green-600'}`}><Clock size={12} className="mr-1"/> {isExpired ? 'Đã hết hạn: ' : 'Hiển thị đến: '} {new Date(item.validUntil).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(item.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                        </div>
                    )
                    })}
                    {announcements.length === 0 && <div className="text-center text-gray-400 py-8">Chưa có thông báo nào</div>}
                </div>
                </div>
            )}
      </div>

      {/* --- MODALS --- */}
      {/* Announcement Modal */}
      {isAnnouncementModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"><h3 className="text-lg font-bold mb-4 text-gray-800">Tạo thông báo mới</h3><form onSubmit={handleAddAnnouncement} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label><input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} placeholder="VD: Thông báo nghỉ lễ..."/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label><textarea required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} placeholder="Nội dung chi tiết..."/></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Hiển thị đến ngày</label><input required type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={announcementForm.validUntil} onChange={e => setAnnouncementForm({...announcementForm, validUntil: e.target.value})}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white" value={announcementForm.priority} onChange={e => setAnnouncementForm({...announcementForm, priority: e.target.value as any})}><option value="normal">Bình thường</option><option value="high">Quan trọng (Nổi bật)</option></select></div></div><div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={() => setIsAnnouncementModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Hủy</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Lưu</button></div></form></div></div>}

    </div>
  );
};

export default Configuration;
