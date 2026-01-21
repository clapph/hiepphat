
import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Trash2, Edit2, Plus, CheckCircle, RefreshCcw } from 'lucide-react';
import { Role, UserAccount, Driver } from '../types';
import { DataService } from '../services/dataService';

interface UsersProps {
  role: Role;
}

const PERMISSION_OPTIONS = [
  { id: 'MANAGE_FUEL', label: 'Quản lý Nhiên liệu' },
  { id: 'MANAGE_ASSIGNMENTS', label: 'Quản lý Phân công' },
  { id: 'VIEW_REPORTS', label: 'Xem Báo cáo' },
  { id: 'MANAGE_EXPENSES', label: 'Duyệt Chi phí' },
];

const Users: React.FC<UsersProps> = ({ role }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    role: 'DRIVER',
    permissions: []
  });
  
  const [resetData, setResetData] = useState({
    userId: '',
    username: '',
    newPassword: ''
  });

  const loadData = () => {
    setUsers(DataService.getUsers());
    setDrivers(DataService.getDrivers());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (role !== 'ADMIN') {
    return null;
  }

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name) return;

    DataService.saveUser(formData as UserAccount);
    setIsModalOpen(false);
    loadData();
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      DataService.deleteUser(id);
      loadData();
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetData.newPassword) {
      DataService.resetPassword(resetData.userId, resetData.newPassword);
      alert('Đã đặt lại mật khẩu thành công!');
      setIsResetModalOpen(false);
      setResetData({ userId: '', username: '', newPassword: '' });
    }
  };

  const openAddModal = () => {
    setFormData({ role: 'DRIVER', permissions: [], password: '123' }); // Default password for new users
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  const openResetModal = (user: UserAccount) => {
    setResetData({ userId: user.id, username: user.username, newPassword: '' });
    setIsResetModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(perm)) {
        return { ...prev, permissions: current.filter(p => p !== perm) };
      } else {
        return { ...prev, permissions: [...current, perm] };
      }
    });
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN': return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Admin</span>;
      case 'MANAGER': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Quản lý</span>;
      case 'DRIVER': return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Tài xế</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <Shield className="mr-2" /> Quản lý Người dùng
          </h2>
          <p className="text-gray-500">Quản lý tài khoản, phân quyền và mật khẩu hệ thống.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm transition-colors"
        >
          <Plus size={18} className="mr-2" /> Thêm tài khoản
        </button>
      </header>

      {/* User List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-6 py-4">Họ tên</th>
                <th className="px-6 py-4">Tên đăng nhập</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Liên kết (Tài xế)</th>
                <th className="px-6 py-4">Quyền hạn (Quản lý)</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => {
                const driver = u.driverId ? drivers.find(d => d.id === u.driverId) : null;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">{u.username}</td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4">
                      {u.role === 'DRIVER' && driver ? (
                        <div className="flex items-center text-green-700">
                          <User size={14} className="mr-1" /> {driver.name}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'MANAGER' && u.permissions ? (
                        <div className="flex flex-wrap gap-1">
                          {u.permissions.map(p => (
                            <span key={p} className="text-[10px] bg-gray-100 px-1 rounded border border-gray-200">
                              {PERMISSION_OPTIONS.find(opt => opt.id === p)?.label || p}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                      <button onClick={() => openResetModal(u)} className="p-1 text-orange-500 hover:bg-orange-50 rounded" title="Reset Mật khẩu">
                        <Lock size={16} />
                      </button>
                      <button onClick={() => openEditModal(u)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Sửa">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {formData.id ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.username || ''}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    disabled={!!formData.id} // Cannot change username
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên hiển thị</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              {!formData.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mặc định</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    value={formData.password}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Người dùng có thể đổi mật khẩu sau khi đăng nhập.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                >
                  <option value="DRIVER">Tài xế</option>
                  <option value="MANAGER">Quản lý</option>
                  <option value="ADMIN">Admin (Quản trị)</option>
                </select>
              </div>

              {/* Conditional Fields based on Role */}
              {formData.role === 'DRIVER' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <label className="block text-sm font-bold text-green-800 mb-2">Liên kết Hồ sơ Tài xế</label>
                  <select 
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.driverId || ''}
                    onChange={e => setFormData({...formData, driverId: e.target.value})}
                  >
                    <option value="">-- Chọn tài xế --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                    ))}
                  </select>
                  <p className="text-xs text-green-700 mt-1">
                    Tài khoản này sẽ chỉ nhìn thấy dữ liệu của tài xế được chọn.
                  </p>
                </div>
              )}

              {formData.role === 'MANAGER' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <label className="block text-sm font-bold text-blue-800 mb-2">Phân quyền Quản lý</label>
                  <div className="space-y-2">
                    {PERMISSION_OPTIONS.map(opt => (
                      <div key={opt.id} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`perm-${opt.id}`}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          checked={(formData.permissions || []).includes(opt.id)}
                          onChange={() => togglePermission(opt.id)}
                        />
                        <label htmlFor={`perm-${opt.id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold mb-4 text-orange-600 flex items-center">
              <RefreshCcw size={20} className="mr-2" /> Đặt lại mật khẩu
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Đang đặt lại mật khẩu cho tài khoản: <strong>{resetData.username}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  value={resetData.newPassword}
                  onChange={e => setResetData({...resetData, newPassword: e.target.value})}
                  placeholder="Nhập mật khẩu mới"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
