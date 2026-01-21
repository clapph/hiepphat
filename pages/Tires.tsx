
import React, { useState, useEffect } from 'react';
import { Disc, Plus, Search, Trash2, Calendar, Tag, DollarSign, Layers, Info, Gauge, Filter, RefreshCw } from 'lucide-react';
import { Role, Vehicle, TireReplacement } from '../types';
import { DataService } from '../services/dataService';

interface TiresProps {
  role: Role;
}

const Tires: React.FC<TiresProps> = ({ role }) => {
  const [replacements, setReplacements] = useState<TireReplacement[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Filters
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterText, setFilterText] = useState(''); // Brand, Size, Pattern

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    vehicleId: string;
    date: string;
    positions: number[]; // Changed to Array
    brand: string;
    size: string;
    patternCode: string;
    serialNumber: string;
    cost: string;
    notes: string;
    currentOdometer: number; // For display
  }>({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    positions: [],
    brand: '',
    size: '',
    patternCode: '',
    serialNumber: '',
    cost: '',
    notes: '',
    currentOdometer: 0
  });

  const loadData = () => {
    setReplacements(DataService.getTireReplacements());
    setVehicles(DataService.getVehicles());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Logic specific to Driver Role
  useEffect(() => {
    if (role === 'DRIVER') {
      // Find the vehicle currently assigned to this driver
      const driverId = 'd1'; // Mock ID
      const assignedVehicleId = DataService.getVehicleForDriver(driverId, new Date());
      if (assignedVehicleId) {
        setFilterVehicle(assignedVehicleId);
      }
    }
  }, [role]);

  // Update current odometer when vehicle selected in modal
  useEffect(() => {
      if (formData.vehicleId) {
          const odo = DataService.calculateVehicleOdometer(formData.vehicleId);
          setFormData(prev => ({ ...prev, currentOdometer: odo }));
      }
  }, [formData.vehicleId]);

  const handleDelete = (id: string) => {
    if (confirm('Xóa lịch sử thay vỏ này?')) {
      DataService.deleteTireReplacement(id);
      loadData();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || formData.positions.length === 0) {
      alert("Vui lòng chọn xe và ít nhất một vị trí thay vỏ.");
      return;
    }

    DataService.addTireReplacement({
      vehicleId: formData.vehicleId,
      date: formData.date,
      positions: formData.positions,
      brand: formData.brand,
      size: formData.size,
      patternCode: formData.patternCode,
      serialNumber: formData.serialNumber,
      cost: Number(formData.cost),
      notes: formData.notes,
      odometerAtInstall: formData.currentOdometer // Auto save current ODO
    });

    setIsModalOpen(false);
    setFormData({
      vehicleId: '',
      date: new Date().toISOString().split('T')[0],
      positions: [],
      brand: '',
      size: '',
      patternCode: '',
      serialNumber: '',
      cost: '',
      notes: '',
      currentOdometer: 0
    });
    loadData();
  };

  const togglePosition = (pos: number) => {
      setFormData(prev => {
          const exists = prev.positions.includes(pos);
          if (exists) {
              return { ...prev, positions: prev.positions.filter(p => p !== pos) };
          } else {
              return { ...prev, positions: [...prev.positions, pos].sort((a,b) => a-b) };
          }
      });
  };

  const resetFilters = () => {
    if (role === 'DRIVER') {
        setFilterFromDate('');
        setFilterToDate('');
        setFilterText('');
        // Do NOT reset filterVehicle for Driver
    } else {
        setFilterVehicle('');
        setFilterFromDate('');
        setFilterToDate('');
        setFilterText('');
    }
  };

  const filteredList = replacements.filter(r => {
    const matchVehicle = filterVehicle === '' || r.vehicleId === filterVehicle;
    
    let matchDate = true;
    if (filterFromDate) matchDate = matchDate && r.date >= filterFromDate;
    if (filterToDate) matchDate = matchDate && r.date <= filterToDate;

    let matchText = true;
    if (filterText) {
      const lowerText = filterText.toLowerCase();
      matchText = 
        r.brand.toLowerCase().includes(lowerText) || 
        r.size.toLowerCase().includes(lowerText) || 
        (r.patternCode && r.patternCode.toLowerCase().includes(lowerText)) ||
        (r.serialNumber && r.serialNumber.toLowerCase().includes(lowerText));
    }

    return matchVehicle && matchDate && matchText;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper to determine if visualizer should show tractor or trailer
  const getVisualizerType = (vehicleId: string) => {
    const v = vehicles.find(v => v.id === vehicleId);
    if (!v) return 'TRUCK';
    return v.category === 'TRAILER' ? 'TRAILER' : 'TRACTOR';
  };

  // --- VISUALIZER COMPONENT (MULTI SELECTION) ---
  const TireIcon = ({ num, isSelected, onClick }: {num: number, isSelected: boolean, onClick: () => void}) => (
    <div 
        onClick={onClick}
        className={`w-10 h-14 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all shadow-sm ${isSelected ? 'bg-primary border-primary text-white scale-110' : 'bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300'}`}
    >
        <span className="text-xs font-bold">{num}</span>
    </div>
  );

  const Axle = ({ tires, selectedPos, onSelect }: {tires: number[], selectedPos: number[], onSelect: (n: number) => void}) => (
      <div className="flex justify-between items-center w-40 md:w-48 bg-gray-100 rounded-lg p-2 mb-2 border border-gray-300">
          <div className="flex gap-1">
             {tires.slice(0, tires.length/2).map(n => (
                 <TireIcon key={n} num={n} isSelected={selectedPos.includes(n)} onClick={() => onSelect(n)} />
             ))}
          </div>
          <div className="h-full w-1 bg-gray-400 rounded-full mx-1"></div>
          <div className="flex gap-1">
             {tires.slice(tires.length/2).map(n => (
                 <TireIcon key={n} num={n} isSelected={selectedPos.includes(n)} onClick={() => onSelect(n)} />
             ))}
          </div>
      </div>
  );

  const renderTireMap = (type: string) => {
      if (type === 'TRACTOR' || type === 'TRUCK') {
          return (
              <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Đầu xe</div>
                  <div className="flex justify-between items-center w-40 md:w-48 bg-gray-100 rounded-lg p-2 mb-4 border border-gray-300">
                      <TireIcon num={1} isSelected={formData.positions.includes(1)} onClick={() => togglePosition(1)} />
                      <div className="h-full w-1 bg-gray-400 rounded-full mx-1"></div>
                      <TireIcon num={2} isSelected={formData.positions.includes(2)} onClick={() => togglePosition(2)} />
                  </div>
                  <Axle tires={[3, 4, 5, 6]} selectedPos={formData.positions} onSelect={(n) => togglePosition(n)} />
                  <Axle tires={[7, 8, 9, 10]} selectedPos={formData.positions} onSelect={(n) => togglePosition(n)} />
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Đuôi xe</div>
              </div>
          )
      } else {
          return (
             <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Chốt kéo</div>
                  <div className="h-8"></div>
                  <Axle tires={[1, 2, 3, 4]} selectedPos={formData.positions} onSelect={(n) => togglePosition(n)} />
                  <Axle tires={[5, 6, 7, 8]} selectedPos={formData.positions} onSelect={(n) => togglePosition(n)} />
                  <Axle tires={[9, 10, 11, 12]} selectedPos={formData.positions} onSelect={(n) => togglePosition(n)} />
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Đuôi Mooc</div>
             </div>
          )
      }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <Disc className="mr-2" /> Quản lý Lốp & Thay vỏ
          </h2>
          <p className="text-gray-500">
            {role === 'ADMIN' 
              ? 'Theo dõi lịch sử thay thế và thông số kỹ thuật vỏ xe.' 
              : 'Xem lịch sử thay vỏ của phương tiện.'}
          </p>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm transition-colors"
          >
            <Plus size={18} className="mr-2" /> Ghi nhận thay vỏ
          </button>
        )}
      </header>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center space-x-2 w-full md:w-auto">
             <Filter size={18} className="text-gray-500" />
             <span className="text-sm font-bold text-gray-700">Bộ lọc:</span>
          </div>
          
          <select 
            className={`bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full md:w-auto p-2 ${role === 'DRIVER' ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : ''}`}
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            disabled={role === 'DRIVER'}
          >
            <option value="">-- Tất cả phương tiện --</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plateNumber} ({v.type})</option>
            ))}
          </select>

          <div className="flex items-center space-x-2 w-full md:w-auto">
             <span className="text-xs text-gray-500">Từ:</span>
             <input 
               type="date"
               className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2 w-full"
               value={filterFromDate}
               onChange={(e) => setFilterFromDate(e.target.value)}
             />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
             <span className="text-xs text-gray-500">Đến:</span>
             <input 
               type="date"
               className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2 w-full"
               value={filterToDate}
               onChange={(e) => setFilterToDate(e.target.value)}
             />
          </div>

          <div className="relative w-full md:w-auto flex-1">
             <input 
               type="text"
               placeholder="Tìm Thương hiệu, Size, Mã gai..."
               className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2 pl-8 w-full"
               value={filterText}
               onChange={(e) => setFilterText(e.target.value)}
             />
             <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
          </div>

          <button 
            onClick={resetFilters}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Xóa bộ lọc"
          >
            <RefreshCw size={18} />
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-6 py-4">Ngày thay</th>
                <th className="px-6 py-4">Phương tiện</th>
                <th className="px-6 py-4">Vị trí</th>
                <th className="px-6 py-4">Thông số kỹ thuật</th>
                {role === 'ADMIN' && <th className="px-6 py-4">Chi phí</th>}
                <th className="px-6 py-4">Vận hành</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map(r => {
                const v = vehicles.find(veh => veh.id === r.vehicleId);
                const currentVehicleOdo = v ? DataService.calculateVehicleOdometer(v.id) : 0;
                const distanceRan = r.odometerAtInstall ? (currentVehicleOdo - r.odometerAtInstall) : 0;

                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(r.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{v?.plateNumber || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{v?.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded">
                        <Disc size={14} className="mr-1" /> 
                        Vị trí: {r.positions && r.positions.length > 0 ? r.positions.join(', ') : '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-700">{r.brand} - {r.size}</div>
                        {r.patternCode && <div className="text-xs text-gray-500 flex items-center"><Layers size={10} className="mr-1"/> Gai: {r.patternCode}</div>}
                        {r.serialNumber && <div className="text-xs text-gray-500 flex items-center"><Tag size={10} className="mr-1"/> SN: {r.serialNumber}</div>}
                      </div>
                    </td>
                    {role === 'ADMIN' && (
                      <td className="px-6 py-4 font-bold text-red-600">
                        {r.cost.toLocaleString()} đ
                      </td>
                    )}
                    <td className="px-6 py-4">
                        {r.odometerAtInstall ? (
                            <div className="text-xs">
                                <div className="text-gray-500">Lúc thay: {r.odometerAtInstall.toLocaleString()} km</div>
                                <div className="font-bold text-green-700 mt-1 flex items-center">
                                    <Gauge size={12} className="mr-1" />
                                    Đã chạy: {distanceRan.toLocaleString()} km
                                </div>
                            </div>
                        ) : <span className="text-gray-400 text-xs">--</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {role === 'ADMIN' ? (
                          <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full">
                            <Trash2 size={16} />
                          </button>
                       ) : (
                          <button className="text-gray-400 cursor-default p-2">
                            <Info size={16} />
                          </button>
                       )}
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr><td colSpan={role === 'ADMIN' ? 7 : 6} className="text-center py-12 text-gray-400">Không có dữ liệu thay vỏ phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Modal */}
      {isModalOpen && role === 'ADMIN' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
             <h3 className="text-lg font-bold mb-4 text-primary-dark border-b pb-2">
                Ghi nhận thay vỏ mới
             </h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Vehicle & Visualizer */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phương tiện</label>
                            <select 
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={formData.vehicleId}
                                onChange={e => setFormData({...formData, vehicleId: e.target.value, positions: []})}
                            >
                                <option value="">-- Chọn xe --</option>
                                {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.plateNumber} ({v.category === 'TRAILER' ? 'Mooc' : 'Đầu kéo'})</option>
                                ))}
                            </select>
                        </div>
                        
                        {formData.vehicleId && (
                            <>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                                    <span className="text-sm text-blue-800 font-medium">ODO hiện tại:</span>
                                    <span className="text-lg font-bold text-primary">{formData.currentOdometer.toLocaleString()} km</span>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-800 mb-3 text-center">
                                        Chọn vị trí thay mới (Có thể chọn nhiều)
                                    </label>
                                    <div className="flex justify-center">
                                        {renderTireMap(getVisualizerType(formData.vehicleId))}
                                    </div>
                                    <p className="text-center text-xs text-blue-600 font-bold mt-2">
                                        {formData.positions.length > 0 ? `Đang chọn: ${formData.positions.join(', ')}` : 'Vui lòng nhấn vào vị trí vỏ trên hình'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Specs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thay</label>
                            <input 
                                required
                                type="date" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="VD: Michelin"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.brand}
                                    onChange={e => setFormData({...formData, brand: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kích thước (Size)</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="VD: 11.00R20"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.size}
                                    onChange={e => setFormData({...formData, size: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã gai (Pattern)</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: X Multi Z"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.patternCode}
                                    onChange={e => setFormData({...formData, patternCode: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số Seri</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: ABC12345"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.serialNumber}
                                    onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí (VND)</label>
                            <div className="relative">
                                <input 
                                    required
                                    type="number" 
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800"
                                    value={formData.cost}
                                    onChange={e => setFormData({...formData, cost: e.target.value})}
                                    placeholder="0"
                                />
                                <DollarSign size={14} className="absolute left-3 top-3 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                            <textarea 
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </div>
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

export default Tires;
