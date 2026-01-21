
import React, { useState, useEffect } from 'react';
import { Gauge, Plus, Calendar, Save, FileText, Activity } from 'lucide-react';
import { Role, Vehicle, DailyOdometer } from '../types';
import { DataService } from '../services/dataService';

interface OdometersProps {
  role: Role;
}

const Odometers: React.FC<OdometersProps> = ({ role }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [odometers, setOdometers] = useState<DailyOdometer[]>([]);
  const [vehicleStats, setVehicleStats] = useState<{id: string, plate: string, initial: number, recorded: number, total: number}[]>([]);

  // Import Text State
  const [importText, setImportText] = useState('');
  
  // Single Entry Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    distance: ''
  });

  const loadData = () => {
    const v = DataService.getVehicles();
    const o = DataService.getDailyOdometers();
    setVehicles(v);
    setOdometers(o);

    // Calculate Stats
    const stats = v.map(veh => {
        const vehicleOdos = o.filter(x => x.vehicleId === veh.id);
        const recorded = vehicleOdos.reduce((sum, x) => sum + x.distance, 0);
        return {
            id: veh.id,
            plate: veh.plateNumber,
            initial: veh.initialOdometer || 0,
            recorded: recorded,
            total: (veh.initialOdometer || 0) + recorded
        };
    });
    setVehicleStats(stats);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (role !== 'ADMIN') {
    return null;
  }

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.distance) return;

    DataService.addDailyOdometer({
        vehicleId: formData.vehicleId,
        date: formData.date,
        distance: Number(formData.distance)
    });

    setFormData({ ...formData, distance: '' }); // Keep date and vehicle for ease of entry
    loadData();
  };

  const handleImport = () => {
      // Parse format: Date(dd/mm/yyyy), Plate, Distance
      // Example: 20/10/2023, 59C-123.45, 150
      const lines = importText.split('\n');
      let count = 0;
      let errors = 0;

      lines.forEach(line => {
          if (!line.trim()) return;
          const parts = line.split(',').map(s => s.trim());
          if (parts.length >= 3) {
              const [dateStr, plate, distStr] = parts;
              
              // Find vehicle
              const vehicle = vehicles.find(v => v.plateNumber === plate);
              
              // Parse Date dd/mm/yyyy to ISO
              const dateParts = dateStr.split('/');
              if (dateParts.length === 3 && vehicle && !isNaN(Number(distStr))) {
                  const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                  DataService.addDailyOdometer({
                      vehicleId: vehicle.id,
                      date: isoDate,
                      distance: Number(distStr)
                  });
                  count++;
              } else {
                  errors++;
              }
          }
      });

      alert(`Đã nhập thành công ${count} dòng. Lỗi ${errors} dòng.`);
      setImportText('');
      loadData();
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-primary-dark flex items-center">
          <Gauge className="mr-2" /> Quản lý Km Vận hành
        </h2>
        <p className="text-gray-500">Ghi nhận quãng đường vận hành hàng ngày của phương tiện.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Input Forms */}
          <div className="space-y-6">
              
              {/* Single Entry */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                      <Plus size={18} className="mr-2 text-primary" /> Nhập liệu hàng ngày
                  </h3>
                  <form onSubmit={handleSingleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                              <input 
                                type="date" 
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Số Km chạy</label>
                              <input 
                                type="number" 
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold"
                                value={formData.distance}
                                onChange={e => setFormData({...formData, distance: e.target.value})}
                                placeholder="0"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phương tiện</label>
                          <select 
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                            value={formData.vehicleId}
                            onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                          >
                              <option value="">-- Chọn xe --</option>
                              {vehicles.map(v => (
                                  <option key={v.id} value={v.id}>{v.plateNumber}</option>
                              ))}
                          </select>
                      </div>
                      <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark font-medium shadow-sm">
                          Lưu
                      </button>
                  </form>
              </div>

              {/* Bulk Import */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                      <FileText size={18} className="mr-2 text-green-600" /> Nhập liệu hàng loạt (Text/Excel)
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 italic">
                      Cấu trúc: Ngày (dd/mm/yyyy), Biển số, Km
                      <br/>Ví dụ: 20/10/2024, 59C-12345, 150
                  </p>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm h-32"
                    placeholder="Paste dữ liệu vào đây..."
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                  />
                  <button 
                    onClick={handleImport}
                    className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center justify-center"
                  >
                      <Save size={16} className="mr-2" /> Xử lý nhập liệu
                  </button>
              </div>
          </div>

          {/* RIGHT: Summary Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center">
                      <Activity size={18} className="mr-2 text-blue-600" /> Tổng hợp Km Tích lũy
                  </h3>
              </div>
              <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-700 font-medium sticky top-0">
                          <tr>
                              <th className="px-4 py-3">Phương tiện</th>
                              <th className="px-4 py-3 text-right">Km ban đầu</th>
                              <th className="px-4 py-3 text-right">Đã chạy thêm</th>
                              <th className="px-4 py-3 text-right">Tổng ODO</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {vehicleStats.map(stat => (
                              <tr key={stat.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-bold text-gray-800">{stat.plate}</td>
                                  <td className="px-4 py-3 text-right text-gray-500">{stat.initial.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right text-blue-600 font-medium">+{stat.recorded.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right font-bold text-primary text-lg">{stat.total.toLocaleString()}</td>
                              </tr>
                          ))}
                          {vehicleStats.length === 0 && (
                              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có dữ liệu</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Odometers;
