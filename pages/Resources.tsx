
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, User, Truck, Container, Gauge } from 'lucide-react';
import { Driver, Vehicle, Role, DriverStatus, VehicleCategory } from '../types';
import { DataService } from '../services/dataService';

interface ResourcesProps {
  role: Role;
}

const Resources: React.FC<ResourcesProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const loadData = () => {
    setDrivers(DataService.getDrivers());
    setVehicles(DataService.getVehicles());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (role !== 'ADMIN') {
    return null;
  }

  const handleDelete = (id: string, type: 'driver' | 'vehicle') => {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      if (type === 'driver') DataService.deleteDriver(id);
      else DataService.deleteVehicle(id);
      loadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'drivers') {
      DataService.saveDriver(formData as Driver);
    } else {
      DataService.saveVehicle(formData as Vehicle);
    }
    setIsModalOpen(false);
    setFormData({});
    loadData();
  };

  const openModal = (item?: any) => {
    if (activeTab === 'drivers') {
      // Default new driver status to official
      setFormData(item || { id: '', status: 'official' });
    } else {
      setFormData(item || { id: '', status: 'active', category: 'TRUCK', initialOdometer: 0 });
    }
    setIsModalOpen(true);
  };

  const getDriverStatusBadge = (status: DriverStatus) => {
    switch(status) {
      case 'official':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Chính thức</span>;
      case 'probation':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Thử việc</span>;
      case 'quit':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Nghỉ việc</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Chính thức</span>;
    }
  };

  // Consistent with Assignments.tsx
  const getVehicleCategoryBadge = (category: VehicleCategory) => {
    switch(category) {
      case 'TRACTOR':
        return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Đầu kéo</span>;
      case 'TRAILER':
        return <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Rơ-moóc</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Xe tải</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary-dark">Quản lý Tài nguyên</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> 
          Thêm {activeTab === 'drivers' ? 'Tài xế' : 'Xe'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'drivers' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center"><User size={16} className="mr-2"/> Danh sách Tài xế</span>
          {activeTab === 'drivers' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'vehicles' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
           <span className="flex items-center"><Truck size={16} className="mr-2"/> Danh sách Xe</span>
          {activeTab === 'vehicles' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
              <tr>
                {activeTab === 'drivers' ? (
                  <>
                    <th className="px-6 py-4">Họ tên</th>
                    <th className="px-6 py-4">Số điện thoại</th>
                    <th className="px-6 py-4">Số bằng lái</th>
                    <th className="px-6 py-4">Hạn bằng lái</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4">Biển số</th>
                    <th className="px-6 py-4">Loại phương tiện</th>
                    <th className="px-6 py-4">Sổ Đăng kiểm</th>
                    <th className="px-6 py-4">Hạn Đăng kiểm</th>
                    <th className="px-6 py-4">Km Tích lũy (Gốc)</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </>
                )}
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === 'drivers' ? drivers.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 text-gray-600">{d.phone}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono bg-gray-50 inline-block my-2 rounded px-2">{d.licenseNumber}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString('vi-VN') : <span className="text-gray-400">--</span>}
                  </td>
                  <td className="px-6 py-4">
                    {getDriverStatusBadge(d.status || 'official')}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(d)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(d.id, 'driver')} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                  </td>
                </tr>
              )) : vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {v.plateNumber}
                    <div className="text-xs text-gray-400 font-normal mt-0.5">{v.type}</div>
                  </td>
                  <td className="px-6 py-4">{getVehicleCategoryBadge(v.category)}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{v.registrationNumber || '--'}</td>
                  <td className="px-6 py-4 text-gray-600">
                     {v.registrationExpiry ? new Date(v.registrationExpiry).toLocaleDateString('vi-VN') : <span className="text-gray-400">--</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                    {v.initialOdometer ? v.initialOdometer.toLocaleString() : 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {v.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(v)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(v.id, 'vehicle')} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {(activeTab === 'drivers' ? drivers : vehicles).length === 0 && (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              {formData.id ? 'Cập nhật' : 'Thêm mới'} {activeTab === 'drivers' ? 'Tài xế' : 'Xe'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              {activeTab === 'drivers' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                     <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        value={formData.status || 'official'}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="official">Chính thức</option>
                        <option value="probation">Thử việc</option>
                        <option value="quit">Nghỉ việc</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider">Thông tin bằng lái</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số bằng lái</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          value={formData.licenseNumber || ''}
                          onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          value={formData.licenseExpiry || ''}
                          onChange={e => setFormData({...formData, licenseExpiry: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase font-bold"
                          value={formData.plateNumber || ''}
                          onChange={e => setFormData({...formData, plateNumber: e.target.value})}
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          value={formData.status || 'active'}
                          onChange={e => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="active">Hoạt động</option>
                          <option value="maintenance">Bảo trì</option>
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại phương tiện</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        value={formData.category || 'TRUCK'}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        <option value="TRUCK">Xe tải (Thường)</option>
                        <option value="TRACTOR">Đầu kéo</option>
                        <option value="TRAILER">Rơ-moóc (Mooc)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả / Loại chi tiết</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        value={formData.type || ''}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        placeholder="VD: Xe 5 tấn..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu vận hành</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      value={formData.operationStartDate || ''}
                      onChange={e => setFormData({...formData, operationStartDate: e.target.value})}
                    />
                  </div>

                  {/* Initial Odometer Field */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <label className="block text-sm font-bold text-blue-900 mb-1 flex items-center">
                        <Gauge size={16} className="mr-2" />
                        Số Km tích lũy ban đầu
                     </label>
                     <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono"
                        value={formData.initialOdometer || ''}
                        onChange={e => setFormData({...formData, initialOdometer: Number(e.target.value)})}
                        placeholder="VD: 150000"
                      />
                      <p className="text-[10px] text-blue-700 mt-1">
                        Nhập số km xe đã chạy trước khi sử dụng phần mềm.
                      </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider">Thông tin Đăng kiểm</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số sổ Đăng kiểm</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          value={formData.registrationNumber || ''}
                          onChange={e => setFormData({...formData, registrationNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn ĐK</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          value={formData.registrationExpiry || ''}
                          onChange={e => setFormData({...formData, registrationExpiry: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                </>
              )}
              <div className="flex justify-end space-x-3 mt-6 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
