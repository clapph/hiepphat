
import React, { useState, useEffect } from 'react';
import { Fuel, CheckCircle, XCircle, Clock, PlusCircle, Copy, Check, Edit2, Share2, DollarSign, AlertTriangle, CheckCheck, RotateCcw, User, Zap, TrendingUp, MapPin, Trash2, Star, List } from 'lucide-react';
import { Role, FuelRequest, Vehicle, Driver, GasStation, FuelPrice } from '../types';
import { DataService } from '../services/dataService';

interface FuelPageProps {
  role: Role;
}

const FuelPage: React.FC<FuelPageProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'prices' | 'stations'>('requests');
  
  // Data States
  const [requests, setRequests] = useState<FuelRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [currentFuelPrice, setCurrentFuelPrice] = useState<number>(0);
  
  // Form State (Driver)
  const [form, setForm] = useState({
    vehicleId: '',
    notes: '',
    requestDate: new Date().toISOString().split('T')[0],
    isTemporary: false
  });

  // Config Forms (Prices & Stations)
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceForm, setPriceForm] = useState({ price: '', effectiveDate: '', notes: '' });
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [stationForm, setStationForm] = useState({ name: '', address: '' });

  // Admin Create Request Modal State
  const [adminCreateModal, setAdminCreateModal] = useState({
    isOpen: false,
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    driverName: '', 
    driverId: '',
    notes: '',
    isTemporary: false,
    gasStation: '',
    isFullTank: false,
    approvedCost: ''
  });

  // Approval Modal State (Admin)
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    reqId: string | null;
    gasStation: string;
    isFullTank: boolean;
    approvedCost: string;
    isEditing: boolean; 
    isTemporaryReq: boolean;
  }>({
    isOpen: false,
    reqId: null,
    gasStation: '',
    isFullTank: false,
    approvedCost: '',
    isEditing: false,
    isTemporaryReq: false
  });

  // Complete Modal State (New)
  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    reqId: string | null;
    actualCost: string;
    actualLitres: string;
    isFullTank: boolean; // to show helper text
  }>({
    isOpen: false,
    reqId: null,
    actualCost: '',
    actualLitres: '',
    isFullTank: false
  });

  // Copy Zalo Modal State
  const [copyModal, setCopyModal] = useState<{isOpen: boolean, text: string, title: string}>({
    isOpen: false,
    text: '',
    title: ''
  });

  const loadData = () => {
    setRequests(DataService.getFuelRequests());
    setVehicles(DataService.getVehicles());
    setDrivers(DataService.getDrivers());
    setGasStations(DataService.getGasStations());
    setFuelPrices(DataService.getFuelPrices());
    
    // Update price
    const price = DataService.getPriceAtTime(new Date().toISOString());
    setCurrentFuelPrice(price);
  };

  useEffect(() => {
    loadData();
    // Init Price Form Date
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setPriceForm(prev => ({ ...prev, effectiveDate: now.toISOString().slice(0, 16) }));
  }, []);

  // --- Handlers for Fuel Requests ---
  // Sync vehicle when Driver changes date
  useEffect(() => {
    if (role === 'DRIVER') {
      const demoDriverId = 'd1'; // Mock user
      const assignedVehicleId = DataService.getVehicleForDriver(demoDriverId, new Date(form.requestDate));
      if (assignedVehicleId) {
        const vehicle = vehicles.find(v => v.id === assignedVehicleId);
        if (vehicle && vehicle.category !== 'TRAILER') {
             setForm(prev => ({ ...prev, vehicleId: assignedVehicleId }));
        }
      }
    }
  }, [form.requestDate, role, vehicles]);

  // Admin Create: Watch for Date or Vehicle changes to resolve Driver
  useEffect(() => {
    if (adminCreateModal.isOpen && adminCreateModal.vehicleId) {
      const dateObj = new Date(adminCreateModal.date);
      const assignment = DataService.getActiveAssignmentForVehicle(adminCreateModal.vehicleId, dateObj);
      
      if (assignment) {
        const dr = drivers.find(d => d.id === assignment.driverId);
        setAdminCreateModal(prev => ({
          ...prev,
          driverId: assignment.driverId,
          driverName: dr ? dr.name : 'Không tìm thấy tên'
        }));
      } else {
        setAdminCreateModal(prev => ({
          ...prev,
          driverId: '',
          driverName: 'Chưa có phân công tài xế ngày này'
        }));
      }
    }
  }, [adminCreateModal.vehicleId, adminCreateModal.date, adminCreateModal.isOpen, drivers]);

  // Recalculate litres when actual cost changes in Complete Modal
  useEffect(() => {
      if (completeModal.isOpen && completeModal.actualCost && currentFuelPrice > 0) {
          const cost = Number(completeModal.actualCost);
          const lit = (cost / currentFuelPrice).toFixed(2);
          setCompleteModal(prev => ({ ...prev, actualLitres: lit }));
      }
  }, [completeModal.actualCost, completeModal.isOpen]);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId) return;
    const demoDriverId = 'd1'; 
    const v = vehicles.find(veh => veh.id === form.vehicleId);
    DataService.addFuelRequest({
      driverId: demoDriverId,
      vehicleId: form.vehicleId,
      notes: form.notes,
      requestDate: form.requestDate,
      isTemporary: form.isTemporary
    });
    const [year, month, day] = form.requestDate.split('-');
    const dateStr = `${day}/${month}/${year}`;
    const header = form.isTemporary ? 'YÊU CẦU ĐỔ DẦU (DẦU TẠM)' : 'YÊU CẦU ĐỔ DẦU';
    const tempNote = form.isTemporary ? '\n- Loại: Dầu tạm (Cần ứng tiền)' : '';
    const zaloText = `${header}\n- Tài xế: ${drivers.find(d => d.id === demoDriverId)?.name}\n- Xe: ${v?.plateNumber}\n- Ngày: ${dateStr}${tempNote}\n- Ghi chú: ${form.notes || 'Không'}`;
    setForm({ ...form, notes: '', isTemporary: false });
    loadData();
    setCopyModal({ isOpen: true, title: 'Đã gửi yêu cầu!', text: zaloText });
  };

  const openAdminCreateModal = () => {
    const defaultStation = gasStations.find(gs => gs.isDefault)?.name || '';
    setAdminCreateModal(prev => ({ ...prev, isOpen: true, gasStation: defaultStation, isFullTank: false, approvedCost: '', isTemporary: false }));
  };

  const handleAdminCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCreateModal.vehicleId || !adminCreateModal.driverId) { alert("Vui lòng chọn xe có tài xế được phân công."); return; }
    if (!adminCreateModal.isTemporary && !adminCreateModal.gasStation) { alert("Vui lòng chọn trạm nhiên liệu."); return; }
    if (!adminCreateModal.isFullTank && Number(adminCreateModal.approvedCost) <= 0) { alert("Vui lòng nhập số tiền hợp lệ."); return; }

    const newReq = DataService.addFuelRequest({
      driverId: adminCreateModal.driverId,
      vehicleId: adminCreateModal.vehicleId,
      requestDate: adminCreateModal.date,
      notes: adminCreateModal.notes,
      isTemporary: adminCreateModal.isTemporary
    });

    DataService.approveFuelRequest(newReq.id, {
      gasStation: adminCreateModal.gasStation,
      isFullTank: adminCreateModal.isFullTank,
      approvedCost: Number(adminCreateModal.approvedCost)
    });

    const v = vehicles.find(veh => veh.id === adminCreateModal.vehicleId);
    const [year, month, day] = adminCreateModal.date.split('-');
    const dateStr = `${day}/${month}/${year}`;
    const cost = Number(adminCreateModal.approvedCost);
    const estLitres = (cost > 0 && currentFuelPrice > 0) ? (cost / currentFuelPrice).toFixed(2) : '0';
    const approvalInfo = adminCreateModal.isFullTank ? "ĐẦY BÌNH" : `${cost.toLocaleString()} VNĐ (~${estLitres} lít)`;
    const header = adminCreateModal.isTemporary ? "DUYỆT ĐỔ DẦU (DẦU TẠM)" : "DUYỆT ĐỔ DẦU";
    const zaloText = `${header}\nNgày: ${dateStr}\nBSX: ${v?.plateNumber}\nSố tiền: ${approvalInfo}`;

    setAdminCreateModal(prev => ({ ...prev, isOpen: false, notes: '', isTemporary: false, vehicleId: '', approvedCost: '' }));
    loadData();
    setCopyModal({ isOpen: true, title: adminCreateModal.isTemporary ? 'Đã tạo, duyệt & lập phiếu ứng!' : 'Đã tạo & duyệt phiếu!', text: zaloText });
  };

  // --- Handlers for Approval ---
  const handleOpenApproval = (req: FuelRequest, isEditing: boolean = false) => {
    let initialStation = req.gasStation || '';
    if (!req.isTemporary && !initialStation) {
      const defaultStation = gasStations.find(gs => gs.isDefault);
      if (defaultStation) initialStation = defaultStation.name;
    }
    setApprovalModal({
      isOpen: true,
      reqId: req.id,
      gasStation: initialStation,
      isFullTank: req.isFullTank || false,
      approvedCost: req.approvedCost ? req.approvedCost.toString() : '',
      isEditing,
      isTemporaryReq: req.isTemporary || false
    });
  };

  const handleConfirmApproval = () => {
    if (!approvalModal.reqId) return;
    if (!approvalModal.isTemporaryReq && !approvalModal.gasStation) { alert("Vui lòng chọn trạm nhiên liệu."); return; }
    if (approvalModal.isTemporaryReq && Number(approvalModal.approvedCost) <= 0) { alert("Dầu tạm yêu cầu phải nhập số tiền để lập phiếu tạm ứng."); return; }

    const dataPayload = { gasStation: approvalModal.gasStation, isFullTank: approvalModal.isFullTank, approvedCost: Number(approvalModal.approvedCost) };
    if (approvalModal.isEditing) { DataService.updateFuelRequestData(approvalModal.reqId, dataPayload); } else { DataService.approveFuelRequest(approvalModal.reqId, dataPayload); }

    const req = requests.find(r => r.id === approvalModal.reqId); 
    const v = vehicles.find(veh => veh.id === req?.vehicleId);
    let dateStr = '';
    if (req?.requestDate) {
      const [year, month, day] = req.requestDate.split('T')[0].split('-');
      dateStr = `${day}/${month}/${year}`;
    }
    const cost = Number(approvalModal.approvedCost);
    const estLitres = (cost > 0 && currentFuelPrice > 0) ? (cost / currentFuelPrice).toFixed(2) : '0';
    const approvalInfo = approvalModal.isFullTank ? "ĐẦY BÌNH" : `${cost.toLocaleString()} VNĐ (~${estLitres} lít)`;
    const header = approvalModal.isTemporaryReq ? "DUYỆT ĐỔ DẦU (DẦU TẠM)" : "DUYỆT ĐỔ DẦU";
    const zaloText = `${header}\nNgày: ${dateStr}\nBSX: ${v?.plateNumber}\nSố tiền: ${approvalInfo}`;

    setApprovalModal({ ...approvalModal, isOpen: false });
    loadData();
    setCopyModal({ isOpen: true, title: approvalModal.isTemporaryReq ? 'Đã duyệt & Tạo phiếu ứng!' : 'Đã lưu thông tin duyệt!', text: zaloText });
  };

  // --- Handlers for Completion (New) ---
  const handleOpenComplete = (req: FuelRequest) => {
      setCompleteModal({
          isOpen: true,
          reqId: req.id,
          actualCost: req.approvedCost ? req.approvedCost.toString() : '',
          actualLitres: req.approvedLitres ? req.approvedLitres.toString() : '',
          isFullTank: req.isFullTank || false
      });
  };

  const handleConfirmComplete = () => {
      if (!completeModal.reqId) return;
      if (!completeModal.actualCost || Number(completeModal.actualCost) <= 0) {
          alert("Vui lòng nhập số tiền thực tế.");
          return;
      }

      DataService.completeFuelRequest(completeModal.reqId, {
          actualCost: Number(completeModal.actualCost),
          actualLitres: Number(completeModal.actualLitres)
      });

      setCompleteModal(prev => ({ ...prev, isOpen: false }));
      loadData();
  };

  // --- Handlers for Prices & Stations (Moved from Configuration) ---
  const handleAddPrice = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addFuelPrice({ price: Number(priceForm.price), effectiveDate: new Date(priceForm.effectiveDate).toISOString(), notes: priceForm.notes });
    setIsPriceModalOpen(false); loadData();
  };
  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addGasStation({ name: stationForm.name, address: stationForm.address, status: 'active' });
    setStationForm({ name: '', address: '' }); setIsStationModalOpen(false); loadData();
  };
  const handleDeleteStation = (id: string) => { if(confirm('Bạn có chắc muốn xóa trạm này?')) { DataService.deleteGasStation(id); loadData(); } };
  const handleSetDefaultStation = (id: string) => { DataService.setGasStationDefault(id); loadData(); };

  // --- Helpers ---
  const getStatusBadge = (req: FuelRequest) => {
    switch(req.status) {
      case 'COMPLETED': return <div className="flex flex-col items-start"><span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-bold mb-1 border border-green-200"><CheckCheck size={14} className="mr-1"/> Đã hoàn tất</span><span className="text-xs text-gray-500 font-medium">{req.actualCost ? `${req.actualCost.toLocaleString()} đ` : (req.isFullTank ? 'Đầy bình' : `${req.approvedCost?.toLocaleString()} đ`)}</span></div>;
      case 'APPROVED': return <div className="flex flex-col items-start"><span className="flex items-center text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs font-bold mb-1"><Check size={12} className="mr-1"/> Chờ đổ dầu</span><span className="text-xs text-gray-500">{req.isFullTank ? 'Đầy bình' : `${req.approvedCost?.toLocaleString()} đ`}</span>{req.approvedLitres ? <span className="text-xs text-gray-400">({req.approvedLitres} lít)</span> : null}</div>;
      case 'REJECTED': return <span className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-bold"><XCircle size={12} className="mr-1"/> Từ chối</span>;
      default: return <span className="flex items-center text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs font-bold"><Clock size={12} className="mr-1"/> Chờ duyệt</span>;
    }
  };

  const estimatedLitres = (Number(approvalModal.approvedCost) > 0 && currentFuelPrice > 0) ? (Number(approvalModal.approvedCost) / currentFuelPrice).toFixed(2) : '0';
  const createEstimatedLitres = (Number(adminCreateModal.approvedCost) > 0 && currentFuelPrice > 0) ? (Number(adminCreateModal.approvedCost) / currentFuelPrice).toFixed(2) : '0';
  const sortedPrices = [...fuelPrices].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-primary-dark flex items-center">
          <Fuel className="mr-2" /> Quản lý Nhiên liệu
        </h2>
        <p className="text-gray-500">Quản lý phiếu cấp dầu, danh sách trạm và biến động giá.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab('requests')} className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${activeTab === 'requests' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          <List size={18} className="mr-2" /> Phiếu Nhiên liệu
          {activeTab === 'requests' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        {role === 'ADMIN' && (
          <>
            <button onClick={() => setActiveTab('prices')} className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${activeTab === 'prices' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
              <TrendingUp size={18} className="mr-2" /> Cấu hình Giá dầu
              {activeTab === 'prices' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
            <button onClick={() => setActiveTab('stations')} className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${activeTab === 'stations' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
              <MapPin size={18} className="mr-2" /> Cấu hình Trạm dầu
              {activeTab === 'stations' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
          </>
        )}
      </div>

      <div className="animate-fade-in">
        {/* TAB: REQUESTS */}
        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Forms */}
            <div className="lg:col-span-1">
              {role === 'DRIVER' ? (
                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-primary">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Yêu cầu đổ dầu mới</h3>
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Ngày yêu cầu</label>
                       <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={form.requestDate} onChange={e => setForm({...form, requestDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chọn xe</label>
                      <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-gray-50" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
                        <option value="">-- Chọn xe --</option>
                        {vehicles.filter(v => v.status === 'active' && v.category !== 'TRAILER').map(v => (
                          <option key={v.id} value={v.id}>{v.plateNumber} ({v.type})</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1">* Tự động chọn xe theo phân công ngày này</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                      <input type="checkbox" id="isTemporary" className="w-4 h-4 text-primary rounded focus:ring-primary" checked={form.isTemporary} onChange={e => setForm({...form, isTemporary: e.target.checked})}/>
                      <label htmlFor="isTemporary" className="text-sm font-medium text-gray-800 cursor-pointer select-none flex-1">Dầu tạm (Tạm ứng tiền)</label>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
                       <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="VD: Cần đổ gấp..."/>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-sm flex justify-center items-center">
                      <PlusCircle size={18} className="mr-2" /> Gửi yêu cầu
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
                    <h3 className="font-bold text-primary-dark mb-2">Thông tin quản trị</h3>
                    <p className="text-sm text-gray-600 mb-3">Admin có thể tạo và duyệt phiếu cấp dầu ngay lập tức.</p>
                    <div className="p-3 bg-white rounded border border-gray-200 text-sm text-gray-700 mb-4">
                       <strong className="block mb-1 text-orange-600">Lưu ý Dầu tạm:</strong>
                       Khi duyệt yêu cầu "Dầu tạm", hệ thống sẽ tự động tạo <span className="font-semibold">Phiếu Tạm Ứng</span> cho tài xế.
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                       <div className="text-sm text-gray-500">Chờ duyệt</div>
                       <div className="text-2xl font-bold text-orange-500">{requests.filter(r => r.status === 'PENDING').length}</div>
                    </div>
                  </div>
                  <button onClick={openAdminCreateModal} className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center shadow-md transform active:scale-95">
                    <Zap size={20} className="mr-2" /> Tạo & Duyệt Nhanh
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: List of Requests */}
            <div className="lg:col-span-2">
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-gray-800">Lịch sử yêu cầu</h3>
                   <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Mới nhất trước</span>
                 </div>
                 <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-3">Ngày</th>
                        <th className="px-4 py-3">Xe</th>
                        <th className="px-4 py-3">Loại/Ghi chú</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        {role === 'ADMIN' && <th className="px-4 py-3 text-right">Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...requests].sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()).map(req => {
                        const v = vehicles.find(x => x.id === req.vehicleId);
                        const d = drivers.find(x => x.id === req.driverId);
                        return (
                          <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500">{new Date(req.requestDate).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{v?.plateNumber}<div className="text-xs text-gray-500 font-normal">{d?.name}</div></td>
                            <td className="px-4 py-3">
                              {req.isTemporary && <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded mb-1">Dầu tạm</span>}
                              {req.actualLitres ? 
                                <div className="font-bold text-green-700">{req.actualLitres} Lít</div> : 
                                (req.amountLitres !== undefined && <div className="font-bold text-gray-700">{req.amountLitres} Lít</div>)
                              }
                              {req.notes ? <div className="text-sm text-gray-600 italic">"{req.notes}"</div> : <span className="text-xs text-gray-400 block">Không có ghi chú</span>}
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(req)}</td>
                            {role === 'ADMIN' && (
                              <td className="px-4 py-3 text-right">
                                {req.status === 'PENDING' ? (
                                  <div className="flex justify-end space-x-2">
                                    <button onClick={() => handleOpenApproval(req)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Duyệt"><CheckCircle size={20} /></button>
                                    <button onClick={() => { if(confirm('Từ chối yêu cầu này?')) { DataService.rejectFuelRequest(req.id); loadData(); } }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Từ chối"><XCircle size={20} /></button>
                                  </div>
                                ) : req.status === 'APPROVED' ? (
                                  <div className="flex justify-end space-x-2">
                                     <button onClick={() => handleOpenComplete(req)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Xác nhận hoàn tất"><CheckCheck size={20} /></button>
                                    <button onClick={() => handleOpenApproval(req, true)} className="text-blue-600 hover:text-blue-800 p-1" title="Sửa"><Edit2 size={16} /></button>
                                  </div>
                                ) : req.status === 'COMPLETED' ? (
                                   <div className="flex justify-end space-x-2">
                                    <button onClick={() => { if(confirm("Hoàn tác trạng thái về 'Đã duyệt'?")) { DataService.revertFuelRequest(req.id); loadData(); } }} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Hoàn tác"><RotateCcw size={16} /></button>
                                  </div>
                                ) : null}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {requests.length === 0 && <tr><td colSpan={role === 'ADMIN' ? 5 : 4} className="text-center py-8 text-gray-400">Chưa có dữ liệu</td></tr>}
                    </tbody>
                  </table>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB: PRICES */}
        {activeTab === 'prices' && role === 'ADMIN' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Biến động giá dầu</h3>
                    <button onClick={() => setIsPriceModalOpen(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm">
                    <PlusCircle size={16} className="mr-2" /> Cập nhật giá mới
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-700"><tr><th className="px-4 py-3">Thời điểm áp dụng</th><th className="px-4 py-3">Giá (VND/Lít)</th><th className="px-4 py-3">Ghi chú</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedPrices.map((p, index) => {
                        const date = new Date(p.effectiveDate);
                        return (
                            <tr key={p.id} className={index === 0 ? "bg-green-50" : ""}>
                            <td className="px-4 py-3 text-gray-600"><div className="flex items-center"><Clock size={14} className="mr-2 text-gray-400" />{date.toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div></td>
                            <td className="px-4 py-3 font-bold text-primary">{p.price.toLocaleString()} đ</td>
                            <td className="px-4 py-3 text-gray-500 italic truncate max-w-xs">{p.notes || '-'}</td>
                            <td className="px-4 py-3">{index === 0 ? <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full">Hiện tại</span> : <span className="text-xs text-gray-400">Đã qua</span>}</td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* TAB: STATIONS */}
        {activeTab === 'stations' && role === 'ADMIN' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Trạm cấp nhiên liệu</h3>
                    <button onClick={() => setIsStationModalOpen(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm">
                    <PlusCircle size={16} className="mr-2" /> Thêm trạm
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gasStations.map(station => (
                    <div key={station.id} className={`border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow ${station.isDefault ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                        <div className="flex-1"><div className="flex items-center"><h4 className="font-bold text-gray-800">{station.name}</h4>{station.isDefault && <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-bold flex items-center"><Star size={10} className="mr-1 text-yellow-600 fill-yellow-600" fill="currentColor" /> Mặc định</span>}</div><p className="text-sm text-gray-500 flex items-center mt-1"><MapPin size={12} className="mr-1" /> {station.address}</p></div>
                        <div className="flex items-center space-x-2">{!station.isDefault && <button onClick={() => handleSetDefaultStation(station.id)} className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-100 rounded-full" title="Đặt làm mặc định"><Star size={18} /></button>}<button onClick={() => handleDeleteStation(station.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button></div>
                    </div>
                    ))}
                    {gasStations.length === 0 && <div className="col-span-2 text-center text-gray-400 py-8">Chưa có dữ liệu trạm</div>}
                </div>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* Admin Create Request Modal */}
      {adminCreateModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-primary-dark">Tạo & Duyệt Nhanh</h3>
            <form onSubmit={handleAdminCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Ngày yêu cầu</label><input type="date" required className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" value={adminCreateModal.date} onChange={e => setAdminCreateModal({...adminCreateModal, date: e.target.value})}/></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Chọn xe</label><select required className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-gray-50 text-sm" value={adminCreateModal.vehicleId} onChange={e => setAdminCreateModal({...adminCreateModal, vehicleId: e.target.value})}><option value="">-- Xe --</option>{vehicles.filter(v => v.status === 'active' && v.category !== 'TRAILER').map(v => (<option key={v.id} value={v.id}>{v.plateNumber} ({v.type})</option>))}</select></div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg flex items-center border border-gray-200"><User size={16} className="text-gray-400 mr-2" /><div className="flex-1 overflow-hidden"><span className="text-[10px] text-gray-500 block">Tài xế phụ trách:</span><span className={`text-xs font-bold truncate block ${adminCreateModal.driverId ? 'text-gray-800' : 'text-red-500 italic'}`}>{adminCreateModal.driverName || '---'}</span></div></div>
              <div className="flex items-center space-x-2 bg-yellow-50 p-2 rounded-lg border border-yellow-100"><input type="checkbox" id="adminCreateTemp" className="w-4 h-4 text-primary rounded focus:ring-primary" checked={adminCreateModal.isTemporary} onChange={e => setAdminCreateModal({...adminCreateModal, isTemporary: e.target.checked})}/><label htmlFor="adminCreateTemp" className="text-sm font-medium text-gray-800 cursor-pointer select-none">Phiếu dầu tạm (Chỉ ứng tiền)</label></div>
              <hr className="border-gray-200" />
              {!adminCreateModal.isTemporary && (<div><label className="block text-xs font-medium text-gray-700 mb-1">Trạm cấp</label><select className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-sm" value={adminCreateModal.gasStation} onChange={e => setAdminCreateModal({...adminCreateModal, gasStation: e.target.value})}><option value="">-- Chọn trạm --</option>{gasStations.filter(gs => gs.status === 'active').map(gs => (<option key={gs.id} value={gs.name}>{gs.name} {gs.isDefault ? '(Mặc định)' : ''}</option>))}</select></div>)}
              <div className="flex items-center space-x-2 mb-2"><input type="checkbox" id="adminCreateFullTank" disabled={adminCreateModal.isTemporary} className={`w-4 h-4 text-primary rounded focus:ring-primary ${adminCreateModal.isTemporary ? 'opacity-50' : ''}`} checked={adminCreateModal.isFullTank} onChange={e => setAdminCreateModal({...adminCreateModal, isFullTank: e.target.checked})}/><label htmlFor="adminCreateFullTank" className={`text-sm font-medium text-gray-700 ${adminCreateModal.isTemporary ? 'text-gray-400' : 'cursor-pointer'}`}>Đổ đầy bình</label></div>
              {!adminCreateModal.isFullTank && (<div><label className="block text-xs font-medium text-gray-700 mb-1">Số tiền duyệt (VND)</label><div className="relative"><input type="number" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" value={adminCreateModal.approvedCost} onChange={e => setAdminCreateModal({...adminCreateModal, approvedCost: e.target.value})} placeholder="0"/><DollarSign size={14} className="absolute left-2 top-3 text-gray-400" /></div>{Number(adminCreateModal.approvedCost) > 0 && currentFuelPrice > 0 && (<p className="text-[10px] text-gray-500 mt-1 text-right">~ {createEstimatedLitres} lít</p>)}</div>)}
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label><input type="text" className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" value={adminCreateModal.notes} onChange={e => setAdminCreateModal({...adminCreateModal, notes: e.target.value})} placeholder="Ghi chú..."/></div>
              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100"><button type="button" onClick={() => setAdminCreateModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">Hủy</button><button type="submit" disabled={!adminCreateModal.driverId} className={`px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg shadow-sm flex items-center text-sm font-bold ${!adminCreateModal.driverId ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}><CheckCircle size={16} className="mr-2" /> Duyệt & Tạo</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Approval Modal */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-primary-dark">{approvalModal.isEditing ? 'Cập nhật thông tin đổ dầu' : 'Duyệt yêu cầu'}</h3>
            {approvalModal.isTemporaryReq && !approvalModal.isEditing && (<div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start mb-4"><AlertTriangle className="text-orange-500 min-w-[20px] mr-2" size={20} /><div className="text-xs text-yellow-800"><span className="font-bold block">Yêu cầu Dầu tạm!</span>Hệ thống sẽ <strong className="underline">tự động lập phiếu tạm ứng</strong> cho tài xế với số tiền bạn nhập dưới đây.</div></div>)}
            <div className="space-y-4">
              {!approvalModal.isTemporaryReq && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Trạm cấp nhiên liệu</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white" value={approvalModal.gasStation} onChange={e => setApprovalModal({...approvalModal, gasStation: e.target.value})}><option value="">-- Chọn trạm --</option>{gasStations.filter(gs => gs.status === 'active').map(gs => (<option key={gs.id} value={gs.name}>{gs.name} {gs.isDefault ? '(Mặc định)' : ''}</option>))}{approvalModal.gasStation && !gasStations.some(gs => gs.name === approvalModal.gasStation) && (<option value={approvalModal.gasStation}>{approvalModal.gasStation} (Hiện không có trong danh sách)</option>)}</select>{gasStations.length === 0 && (<p className="text-xs text-red-500 mt-1">Chưa có danh sách trạm. Vui lòng thêm trong Cấu hình.</p>)}</div>)}
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg"><input type="checkbox" id="fullTank" disabled={approvalModal.isTemporaryReq} className={`w-4 h-4 text-primary rounded focus:ring-primary ${approvalModal.isTemporaryReq ? 'opacity-50 cursor-not-allowed' : ''}`} checked={approvalModal.isFullTank} onChange={e => setApprovalModal({...approvalModal, isFullTank: e.target.checked})}/><label htmlFor="fullTank" className={`text-sm font-medium text-gray-700 select-none ${approvalModal.isTemporaryReq ? 'text-gray-400' : 'cursor-pointer'}`}>Cho phép đổ đầy bình</label></div>
              {!approvalModal.isFullTank && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Số tiền duyệt {currentFuelPrice > 0 && <span className="ml-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">Đơn giá: {currentFuelPrice.toLocaleString()} đ/l</span>}</label><div className="relative"><input type="number" className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={approvalModal.approvedCost} onChange={e => setApprovalModal({...approvalModal, approvedCost: e.target.value})} placeholder="0" autoFocus/><DollarSign size={14} className="absolute left-3 top-3 text-gray-400" /></div>{Number(approvalModal.approvedCost) > 0 && currentFuelPrice > 0 && (<p className="text-xs text-gray-500 mt-1 text-right">Tương đương: <strong className="text-gray-800">{estimatedLitres} lít</strong></p>)}</div>)}
            </div>
            <div className="flex justify-end space-x-3 mt-6"><button onClick={() => setApprovalModal({...approvalModal, isOpen: false})} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button><button onClick={handleConfirmApproval} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm flex items-center"><Check size={16} className="mr-2" />{approvalModal.isEditing ? 'Lưu thay đổi' : 'Xác nhận'}</button></div>
          </div>
        </div>
      )}

      {/* COMPLETE MODAL (NEW) */}
      {completeModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
             <h3 className="text-lg font-bold mb-4 text-green-700 flex items-center">
               <CheckCheck size={20} className="mr-2" /> Xác nhận đã đổ
             </h3>
             
             {completeModal.isFullTank && (
               <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800 mb-4">
                 <strong className="block mb-1">Yêu cầu Đầy bình</strong>
                 Vui lòng nhập số tiền thực tế theo hóa đơn để hoàn tất.
               </div>
             )}

             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thực tế (VND)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800"
                      value={completeModal.actualCost}
                      onChange={e => setCompleteModal({...completeModal, actualCost: e.target.value})}
                      placeholder="0"
                      autoFocus
                    />
                    <DollarSign size={14} className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lít thực tế</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-gray-50"
                    value={completeModal.actualLitres}
                    onChange={e => setCompleteModal({...completeModal, actualLitres: e.target.value})}
                    placeholder="0"
                  />
                  {currentFuelPrice > 0 && <p className="text-[10px] text-gray-500 mt-1 text-right">Tự động tính theo giá {currentFuelPrice.toLocaleString()} đ/l</p>}
                </div>
             </div>

             <div className="flex justify-end space-x-3 mt-6 pt-2 border-t">
               <button onClick={() => setCompleteModal({...completeModal, isOpen: false})} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
               <button onClick={handleConfirmComplete} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm flex items-center font-bold">
                 <Check size={16} className="mr-2" /> Hoàn tất
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Copy Zalo Modal */}
      {copyModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Share2 className="text-green-600" size={24} /></div><h3 className="text-xl font-bold mb-2 text-gray-800">{copyModal.title}</h3><p className="text-gray-500 text-sm mb-4">Sao chép nội dung bên dưới để gửi qua Zalo</p><div className="bg-gray-50 p-4 rounded-lg text-left text-sm font-mono text-gray-700 mb-4 whitespace-pre-wrap border border-gray-200">{copyModal.text}</div><div className="flex justify-center space-x-3"><button onClick={() => setCopyModal({...copyModal, isOpen: false})} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Đóng</button><button onClick={() => { navigator.clipboard.writeText(copyModal.text); setCopyModal({...copyModal, isOpen: false}); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center"><Copy size={16} className="mr-2" /> Sao chép</button></div>
          </div>
        </div>
      )}

      {/* Modal: Add Price */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"><h3 className="text-lg font-bold mb-4 text-gray-800">Cập nhật giá dầu</h3><form onSubmit={handleAddPrice} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Giá dầu (VND)</label><div className="relative"><input required type="number" className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={priceForm.price} onChange={e => setPriceForm({...priceForm, price: e.target.value})} placeholder="VD: 21500"/><DollarSign size={14} className="absolute left-3 top-3 text-gray-400" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Thời điểm áp dụng</label><input required type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={priceForm.effectiveDate} onChange={e => setPriceForm({...priceForm, effectiveDate: e.target.value})}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={priceForm.notes} onChange={e => setPriceForm({...priceForm, notes: e.target.value})} placeholder="VD: Điều chỉnh định kỳ"/></div><div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={() => setIsPriceModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Hủy</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Lưu</button></div></form></div></div>
      )}
      {/* Station Modal */}
      {isStationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"><h3 className="text-lg font-bold mb-4 text-gray-800">Thêm trạm nhiên liệu</h3><form onSubmit={handleAddStation} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Tên trạm</label><input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={stationForm.name} onChange={e => setStationForm({...stationForm, name: e.target.value})} placeholder="VD: Petrolimex..."/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ / Khu vực</label><input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" value={stationForm.address} onChange={e => setStationForm({...stationForm, address: e.target.value})} placeholder="VD: QL1A, Quận 12..."/></div><div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={() => setIsStationModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Hủy</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Lưu</button></div></form></div></div>
      )}

    </div>
  );
};

export default FuelPage;
