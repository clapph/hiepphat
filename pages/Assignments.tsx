
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Trash2, ArrowRight, Link, Truck, Edit2 } from 'lucide-react';
import { Role, Assignment, Driver, Vehicle } from '../types';
import { DataService } from '../services/dataService';

interface AssignmentsProps {
  role: Role;
}

const Assignments: React.FC<AssignmentsProps> = ({ role }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  const currentDriverId = 'd1'; // Mock logged in driver

  // New assignment state
  const [newAssign, setNewAssign] = useState<Partial<Assignment>>({
    startDate: new Date().toISOString().split('T')[0],
  });

  const loadData = () => {
    setAssignments(DataService.getAssignments());
    setDrivers(DataService.getDrivers());
    setVehicles(DataService.getVehicles());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssign.driverId || !newAssign.vehicleId || !newAssign.startDate) return;

    if (newAssign.id) {
        // Update existing
        DataService.updateAssignment(newAssign.id, newAssign);
    } else {
        // Add new
        DataService.addAssignment(newAssign as any);
    }
    
    setIsModalOpen(false);
    setNewAssign({ startDate: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleEdit = (assign: Assignment) => {
      setNewAssign({
          id: assign.id,
          driverId: assign.driverId,
          vehicleId: assign.vehicleId,
          trailerId: assign.trailerId,
          startDate: assign.startDate.split('T')[0],
          endDate: assign.endDate ? assign.endDate.split('T')[0] : undefined
      });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xóa phân công này?')) {
      DataService.deleteAssignment(id);
      loadData();
    }
  };

  // Helper to get active assignment for a vehicle on searchDate
  const getActiveAssignment = (vehicleId: string) => {
    return DataService.getActiveAssignmentForVehicle(vehicleId, new Date(searchDate));
  };

  const selectedVehicle = vehicles.find(v => v.id === newAssign.vehicleId);

  // Filter vehicles to show based on role
  const displayedVehicles = vehicles.filter(v => v.category !== 'TRAILER').filter(vehicle => {
    if (role === 'ADMIN') return true;
    
    // For DRIVER: Only show if they are assigned to this vehicle on the search date
    const activeAssign = getActiveAssignment(vehicle.id);
    return activeAssign?.driverId === currentDriverId;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary-dark">Phân công xe & Tài xế</h2>
        {role === 'ADMIN' && (
          <button 
            onClick={() => {
                setNewAssign({ startDate: new Date().toISOString().split('T')[0] });
                setIsModalOpen(true);
            }}
            className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" /> 
            Phân công mới
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2 text-gray-700">
           <Search size={18} />
           <span className="font-medium">Xem lịch ngày:</span>
        </div>
        <input 
          type="date"
          className="border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />
        <span className="text-xs text-gray-500 italic ml-auto">
          {role === 'DRIVER' ? '* Hiển thị xe bạn được phân công' : '* Hiển thị tài xế đang phụ trách xe'}
        </span>
      </div>

      {/* Grid of Vehicles showing current driver */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Only show Trucks and Tractors (Trailers are shown attached) */}
        {displayedVehicles.map(vehicle => {
          const activeAssign = getActiveAssignment(vehicle.id);
          const assignedDriver = activeAssign ? drivers.find(d => d.id === activeAssign.driverId) : null;
          
          // Get attached trailer if any
          let attachedTrailer: Vehicle | undefined;
          if (activeAssign && activeAssign.trailerId) {
            attachedTrailer = vehicles.find(v => v.id === activeAssign.trailerId);
          }
          
          return (
            <div key={vehicle.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{vehicle.plateNumber}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{vehicle.type}</span>
                    {vehicle.category === 'TRACTOR' && <span className="text-blue-600 bg-blue-50 px-1 rounded text-xs">Đầu kéo</span>}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${vehicle.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} title={vehicle.status === 'active' ? 'Hoạt động' : 'Bảo trì'} />
              </div>
              
              {/* Trailer Info (If Tractor) */}
              {vehicle.category === 'TRACTOR' && (
                <div className="mb-3 p-2 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center text-sm">
                   <Link size={14} className="mr-2 text-gray-400" />
                   {attachedTrailer ? (
                     <span className="font-semibold text-gray-700">{attachedTrailer.plateNumber} <span className="font-normal text-gray-500">({attachedTrailer.type})</span></span>
                   ) : (
                     <span className="text-gray-400 italic">Chưa kéo Mooc</span>
                   )}
                </div>
              )}

              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Tài xế phụ trách</p>
                {assignedDriver ? (
                  <div>
                    <p className="font-medium text-primary-dark flex items-center">
                      <span className="truncate">{assignedDriver.name}</span>
                      {role === 'DRIVER' && assignedDriver.id === currentDriverId && (
                          <span className="ml-2 bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded border border-green-200">Bạn</span>
                      )}
                    </p>
                    <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                      <Calendar size={12} />
                      {activeAssign?.endDate ? (
                        <span>Đến hết: <span className="font-bold">{new Date(activeAssign.endDate).toLocaleDateString('vi-VN')}</span></span>
                      ) : (
                        <span>Cố định</span>
                      )}
                    </div>
                  </div>
                ) : (
                   <p className="text-gray-400 italic text-sm">Chưa có phân công</p>
                )}
              </div>
            </div>
          );
        })}
        {displayedVehicles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                <Truck size={48} className="text-gray-300 mb-2" />
                <p className="font-medium">
                    {role === 'DRIVER' 
                        ? `Bạn không có lịch phân công xe nào vào ngày ${new Date(searchDate).toLocaleDateString('vi-VN')}` 
                        : 'Không tìm thấy xe nào phù hợp'}
                </p>
            </div>
        )}
      </div>

      {role === 'ADMIN' && (
        <div className="mt-10">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">Lịch sử & Danh sách phân công</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                  <tr>
                    <th className="px-6 py-3">Xe</th>
                    <th className="px-6 py-3">Rơ-moóc (Mooc)</th>
                    <th className="px-6 py-3">Tài xế</th>
                    <th className="px-6 py-3">Từ ngày</th>
                    <th className="px-6 py-3">Đến ngày</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(assign => {
                    const d = drivers.find(x => x.id === assign.driverId);
                    const v = vehicles.find(x => x.id === assign.vehicleId);
                    const t = assign.trailerId ? vehicles.find(x => x.id === assign.trailerId) : null;
                    return (
                      <tr key={assign.id} className="hover:bg-gray-50">
                         <td className="px-6 py-3 font-medium">
                           {v?.plateNumber || 'N/A'}
                           {v?.category === 'TRACTOR' && <span className="ml-1 text-[10px] text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">Đầu kéo</span>}
                         </td>
                         <td className="px-6 py-3">
                           {t ? (
                             <span className="font-medium text-gray-700">{t.plateNumber}</span>
                           ) : (
                             <span className="text-gray-300">-</span>
                           )}
                         </td>
                         <td className="px-6 py-3">{d?.name || 'N/A'}</td>
                         <td className="px-6 py-3">{new Date(assign.startDate).toLocaleDateString('vi-VN')}</td>
                         <td className="px-6 py-3">
                           {assign.endDate ? (
                             <span className="text-orange-600 font-medium">{new Date(assign.endDate).toLocaleDateString('vi-VN')}</span>
                           ) : (
                             <span className="text-gray-400 italic">Không thời hạn</span>
                           )}
                         </td>
                         <td className="px-6 py-3 text-right">
                           <button onClick={() => handleEdit(assign)} className="text-blue-500 hover:text-blue-700 mr-2">
                             <Edit2 size={16} />
                           </button>
                           <button onClick={() => handleDelete(assign.id)} className="text-red-500 hover:text-red-700">
                             <Trash2 size={16} />
                           </button>
                         </td>
                      </tr>
                    );
                  })}
                  {assignments.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-gray-400">Chưa có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
                {newAssign.id ? 'Cập nhật phân công' : 'Tạo phân công mới'}
            </h3>
            <form onSubmit={handleAddOrUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Xe (Đầu kéo / Xe tải)</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={newAssign.vehicleId || ''}
                  onChange={e => {
                    // Reset trailer if changing vehicle
                    setNewAssign({...newAssign, vehicleId: e.target.value, trailerId: undefined});
                  }}
                >
                  <option value="">-- Chọn xe --</option>
                  {/* Filter out Trailers, they are assigned to Tractors */}
                  {vehicles.filter(v => v.status === 'active' && v.category !== 'TRAILER').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} - {v.category === 'TRACTOR' ? 'Đầu kéo' : 'Xe tải'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Trailer Select only if selected vehicle is TRACTOR */}
              {selectedVehicle?.category === 'TRACTOR' && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 animate-fade-in">
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                     <Link size={14} className="mr-1" /> Chọn Rơ-moóc (Mooc)
                   </label>
                   <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                    value={newAssign.trailerId || ''}
                    onChange={e => setNewAssign({...newAssign, trailerId: e.target.value})}
                  >
                    <option value="">-- Không kéo Mooc --</option>
                    {vehicles.filter(v => v.status === 'active' && v.category === 'TRAILER').map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} - {v.type}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Tài xế</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={newAssign.driverId || ''}
                  onChange={e => setNewAssign({...newAssign, driverId: e.target.value})}
                >
                  <option value="">-- Chọn tài xế --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={newAssign.startDate}
                    onChange={e => setNewAssign({...newAssign, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={newAssign.endDate || ''}
                    onChange={e => setNewAssign({...newAssign, endDate: e.target.value})}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Để trống nếu cố định</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg mt-2">
                Nếu chọn "Đến ngày", sau ngày này hệ thống sẽ tự động hiển thị lại tài xế được phân công cố định trước đó (nếu có).
              </div>

              <div className="flex justify-end space-x-3 mt-6">
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
                  {newAssign.id ? 'Lưu thay đổi' : 'Lưu phân công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
