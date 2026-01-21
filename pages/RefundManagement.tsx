
import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Save, Search, RefreshCw, Layers, ChevronDown, ChevronRight, Filter, Download, CheckSquare, Square, Calendar, FolderOpen, AlertCircle } from 'lucide-react';
import { Role, PayOnBehalfSlip, RefundEntry, PayOnBehalf } from '../types';
import { DataService } from '../services/dataService';
import * as XLSX from 'xlsx';

interface RefundManagementProps {
  role: Role;
}

interface CombinedRefundData {
  containerNo: string;
  customerReconciliation: string; // From one of the slips/originals
  slips: (PayOnBehalfSlip & { original?: PayOnBehalf })[];
  totalPobAmount: number;
  refundDate: string;
  refundAmount: number;
  diffAmount: number;
  lastSlipDate: string;
  slipCount: number;
}

// Color palettes for groups to distinguish them visualy
const GROUP_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'border-l-blue-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', accent: 'border-l-emerald-500' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', accent: 'border-l-purple-500' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', accent: 'border-l-orange-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', accent: 'border-l-cyan-500' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', accent: 'border-l-rose-500' },
];

const RefundManagement: React.FC<RefundManagementProps> = ({ role }) => {
  const [slips, setSlips] = useState<PayOnBehalfSlip[]>([]);
  const [originals, setOriginals] = useState<PayOnBehalf[]>([]);
  const [refundEntries, setRefundEntries] = useState<RefundEntry[]>([]);
  
  // Filters
  const [filterContainer, setFilterContainer] = useState('');
  const [filterFromDate, setFilterFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Default look back 1 month
    return date.toISOString().split('T')[0];
  });
  const [filterToDate, setFilterToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterRecon, setFilterRecon] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  // UI State
  const [editingContainer, setEditingContainer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; amount: string }>({ date: '', amount: '' });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set()); // New: Collapse entire recon group
  const [selectedContainers, setSelectedContainers] = useState<Set<string>>(new Set());

  const loadData = () => {
    setSlips(DataService.getPayOnBehalfSlips());
    setOriginals(DataService.getPayOnBehalf());
    setRefundEntries(DataService.getRefundEntries());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (role !== 'ADMIN') {
    return <div className="p-8 text-center text-gray-500">Bạn không có quyền truy cập trang này.</div>;
  }

  // --- DATA PROCESSING ---
  const combinedData: CombinedRefundData[] = useMemo(() => {
    // 1. Join Slips with Originals
    const enrichedSlips = slips.map(slip => {
        const original = originals.find(o => o.id === slip.refId);
        return { ...slip, original };
    });

    // 2. Filter Slips based on criteria
    const filteredSlips = enrichedSlips.filter(s => {
        const sDate = s.date.split('T')[0];
        const dateMatch = sDate >= filterFromDate && sDate <= filterToDate;
        const contMatch = s.containerNo?.toLowerCase().includes(filterContainer.toLowerCase()) ?? false;
        
        let reconMatch = true;
        if (filterRecon) {
            reconMatch = s.original?.customerReconciliation?.toLowerCase().includes(filterRecon.toLowerCase()) ?? false;
        }

        let warehouseMatch = true;
        if (filterWarehouse) {
            warehouseMatch = s.original?.warehouse?.toLowerCase().includes(filterWarehouse.toLowerCase()) ?? false;
        }

        return dateMatch && contMatch && reconMatch && warehouseMatch;
    });

    // 3. Group by Container
    const groups: Record<string, { 
        slips: typeof filteredSlips; 
        total: number; 
        lastDate: string;
        recon: string;
    }> = {};
    
    filteredSlips.forEach(slip => {
      const cont = slip.containerNo;
      if (!cont) return; 

      if (!groups[cont]) {
        groups[cont] = { 
            slips: [], 
            total: 0, 
            lastDate: slip.date,
            recon: slip.original?.customerReconciliation || '' // Take first found
        };
      }
      
      groups[cont].slips.push(slip);
      groups[cont].total += slip.amount;
      if (slip.date > groups[cont].lastDate) {
        groups[cont].lastDate = slip.date;
      }
      // Update Recon if empty (sometimes first slip might not have it)
      if (!groups[cont].recon && slip.original?.customerReconciliation) {
          groups[cont].recon = slip.original.customerReconciliation;
      }
    });

    // 4. Merge with Refund Entries
    const results = Object.keys(groups).map(cont => {
      const group = groups[cont];
      const refundEntry = refundEntries.find(r => r.containerNo === cont);
      
      const refundAmount = refundEntry ? refundEntry.refundAmount : 0;
      const refundDate = refundEntry ? refundEntry.refundDate : '';
      
      return {
        containerNo: cont,
        customerReconciliation: group.recon || 'Chưa đối chiếu', // Fallback for grouping
        slips: group.slips.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        totalPobAmount: group.total,
        slipCount: group.slips.length,
        lastSlipDate: group.lastDate,
        refundDate: refundDate,
        refundAmount: refundAmount,
        diffAmount: refundAmount - group.total
      };
    });

    return results;
  }, [slips, originals, refundEntries, filterFromDate, filterToDate, filterContainer, filterRecon, filterWarehouse]);

  // --- GROUPING BY RECONCILIATION ---
  const groupedData = useMemo(() => {
      const groups: Record<string, CombinedRefundData[]> = {};
      
      combinedData.forEach(item => {
          const key = item.customerReconciliation;
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
      });

      // Sort keys (Reconciliations) - "Chưa đối chiếu" goes last, others alphabetical/date based usually
      const sortedKeys = Object.keys(groups).sort((a, b) => {
          if (a === 'Chưa đối chiếu') return 1;
          if (b === 'Chưa đối chiếu') return -1;
          return a.localeCompare(b);
      });

      return sortedKeys.map(key => ({
          key,
          items: groups[key].sort((a, b) => b.lastSlipDate.localeCompare(a.lastSlipDate)), // Sort containers within group by date
          // Calculate Group Totals
          totalPob: groups[key].reduce((sum, i) => sum + i.totalPobAmount, 0),
          totalRefund: groups[key].reduce((sum, i) => sum + i.refundAmount, 0),
          totalDiff: groups[key].reduce((sum, i) => sum + i.diffAmount, 0),
      }));
  }, [combinedData]);


  // --- HANDLERS ---
  const toggleRowExpand = (containerNo: string) => {
      const newSet = new Set(expandedRows);
      if (newSet.has(containerNo)) newSet.delete(containerNo);
      else newSet.add(containerNo);
      setExpandedRows(newSet);
  };

  const toggleGroupCollapse = (groupKey: string) => {
      const newSet = new Set(collapsedGroups);
      if (newSet.has(groupKey)) newSet.delete(groupKey);
      else newSet.add(groupKey);
      setCollapsedGroups(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedContainers.size === combinedData.length && combinedData.length > 0) {
          setSelectedContainers(new Set());
      } else {
          setSelectedContainers(new Set(combinedData.map(i => i.containerNo)));
      }
  };

  const toggleSelectGroup = (items: CombinedRefundData[]) => {
      const newSet = new Set(selectedContainers);
      const allSelected = items.every(i => newSet.has(i.containerNo));
      
      items.forEach(i => {
          if (allSelected) newSet.delete(i.containerNo);
          else newSet.add(i.containerNo);
      });
      setSelectedContainers(newSet);
  };

  const toggleSelect = (containerNo: string) => {
      const newSet = new Set(selectedContainers);
      if (newSet.has(containerNo)) newSet.delete(containerNo);
      else newSet.add(containerNo);
      setSelectedContainers(newSet);
  };

  const startEdit = (item: CombinedRefundData) => {
    setEditingContainer(item.containerNo);
    setEditForm({
      date: item.refundDate || new Date().toISOString().split('T')[0],
      amount: item.refundAmount > 0 ? item.refundAmount.toString() : ''
    });
  };

  const cancelEdit = () => {
    setEditingContainer(null);
    setEditForm({ date: '', amount: '' });
  };

  const saveEdit = (containerNo: string) => {
    const amount = parseInt(editForm.amount.replace(/\D/g, '')) || 0;
    DataService.saveRefundEntry({
      containerNo: containerNo,
      refundDate: editForm.date,
      refundAmount: amount,
      updatedAt: new Date().toISOString()
    });
    setEditingContainer(null);
    loadData();
  };

  const handleExportSelected = () => {
      if (selectedContainers.size === 0) return;
      
      const exportData: any[] = [];
      combinedData.filter(d => selectedContainers.has(d.containerNo)).forEach(group => {
          group.slips.forEach(slip => {
              exportData.push({
                  'Số Container': group.containerNo,
                  'Đối chiếu KH': group.customerReconciliation,
                  'Ngày chi': new Date(slip.date).toLocaleDateString('vi-VN'),
                  'Biển số xe': slip.vehiclePlate,
                  'Ngày vận chuyển': slip.original?.date ? new Date(slip.original.date).toLocaleDateString('vi-VN') : '',
                  'Tác nghiệp': slip.original?.operation || '',
                  'Kho': slip.original?.warehouse || '',
                  'Số tiền chi': slip.amount,
                  'Ngày hoàn ứng': group.refundDate ? new Date(group.refundDate).toLocaleDateString('vi-VN') : '',
                  'Số tiền hoàn ứng (Cont)': group.refundAmount,
                  'Chênh lệch': group.diffAmount
              });
          });
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "HoanUng");
      XLSX.writeFile(workbook, `HoanUng_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetFilters = () => {
      const date = new Date();
      setFilterFromDate(new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]); 
      setFilterToDate(new Date().toISOString().split('T')[0]);
      setFilterContainer('');
      setFilterRecon('');
      setFilterWarehouse('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark flex items-center">
            <Layers className="mr-2" /> Quản lý Hoàn ứng
          </h2>
          <p className="text-gray-500">Theo dõi và đối chiếu tiền hoàn ứng theo từng Container.</p>
        </div>
        {selectedContainers.size > 0 && (
            <button 
                onClick={handleExportSelected}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors"
            >
                <Download size={18} className="mr-2" /> Xuất Excel ({selectedContainers.size})
            </button>
        )}
      </header>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
         <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
            <Filter size={18} /> Bộ lọc dữ liệu
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Từ ngày (Ngày chi)</label>
                <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={filterFromDate}
                    onChange={e => setFilterFromDate(e.target.value)}
                />
             </div>
             <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Đến ngày (Ngày chi)</label>
                <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={filterToDate}
                    onChange={e => setFilterToDate(e.target.value)}
                />
             </div>
             <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Đối chiếu KH</label>
                <input 
                    type="text" 
                    placeholder="Tìm đối chiếu..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={filterRecon}
                    onChange={e => setFilterRecon(e.target.value)}
                />
             </div>
             <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Kho / Depot</label>
                <input 
                    type="text" 
                    placeholder="Tìm kho..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={filterWarehouse}
                    onChange={e => setFilterWarehouse(e.target.value)}
                />
             </div>
             <div className="flex gap-2 items-end">
                 <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Số Container</label>
                    <input 
                        type="text" 
                        placeholder="Tìm số Cont..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm font-mono"
                        value={filterContainer}
                        onChange={e => setFilterContainer(e.target.value)}
                    />
                 </div>
                 <button 
                    onClick={resetFilters}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg mb-0.5"
                    title="Làm mới bộ lọc"
                 >
                    <RefreshCw size={18} />
                 </button>
             </div>
         </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-white font-bold uppercase">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                    <button onClick={toggleSelectAll} className="hover:text-blue-300">
                        {selectedContainers.size === combinedData.length && combinedData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                </th>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Số Container</th>
                <th className="px-4 py-3">Đối chiếu KH</th>
                <th className="px-4 py-3 text-center">SL Phiếu</th>
                <th className="px-4 py-3 text-right">Tổng tiền chi hộ</th>
                <th className="px-4 py-3">Ngày hoàn ứng</th>
                <th className="px-4 py-3 text-right">Số tiền hoàn ứng</th>
                <th className="px-4 py-3 text-right">Chênh lệch</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groupedData.map((group, groupIndex) => {
                  const isCollapsed = collapsedGroups.has(group.key);
                  // Determine theme based on index
                  const theme = GROUP_COLORS[groupIndex % GROUP_COLORS.length];
                  
                  // Group Summary Logic for Diff color
                  let groupDiffColor = 'text-gray-500';
                  if (group.totalDiff < 0) groupDiffColor = 'text-red-600 font-bold';
                  else if (group.totalDiff > 0) groupDiffColor = 'text-green-600 font-bold';

                  return (
                    <React.Fragment key={group.key}>
                        {/* GROUP HEADER ROW */}
                        <tr className={`${theme.bg} ${theme.border} border-b border-t ${theme.accent} border-l-4`}>
                            <td className="px-4 py-3 text-center">
                                <button onClick={() => toggleSelectGroup(group.items)} className={`${theme.text} opacity-50 hover:opacity-100`}>
                                    <CheckSquare size={18} />
                                </button>
                            </td>
                            <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleGroupCollapse(group.key)}>
                                {isCollapsed ? <ChevronRight size={18} className={theme.text} /> : <ChevronDown size={18} className={theme.text} />}
                            </td>
                            <td colSpan={3} className={`px-4 py-3 font-bold ${theme.text} text-sm uppercase flex items-center`}>
                                <FolderOpen size={16} className="mr-2" />
                                {group.key} 
                                <span className="ml-2 text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200 opacity-80 text-gray-600 font-normal">
                                    {group.items.length} Cont
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-orange-700 text-sm">
                                {group.totalPob.toLocaleString()}
                            </td>
                            <td></td>
                            <td className="px-4 py-3 text-right font-bold text-green-700 text-sm">
                                {group.totalRefund.toLocaleString()}
                            </td>
                            <td className={`px-4 py-3 text-right text-sm ${groupDiffColor}`}>
                                {group.totalDiff.toLocaleString()}
                            </td>
                            <td></td>
                        </tr>

                        {/* ITEMS IN GROUP */}
                        {!isCollapsed && group.items.map(item => {
                            const isEditing = editingContainer === item.containerNo;
                            const isExpanded = expandedRows.has(item.containerNo);
                            const isSelected = selectedContainers.has(item.containerNo);
                            
                            let diffColor = 'text-gray-800';
                            if (item.diffAmount < 0) diffColor = 'text-red-600 font-bold';
                            else if (item.diffAmount > 0) diffColor = 'text-green-600 font-bold';
                            else if (item.refundAmount > 0) diffColor = 'text-gray-400';

                            return (
                                <React.Fragment key={item.containerNo}>
                                    <tr className={`hover:bg-gray-50 border-b border-gray-50 ${isEditing ? 'bg-blue-50' : (isSelected ? 'bg-blue-50/30' : '')}`}>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => toggleSelect(item.containerNo)} className={isSelected ? 'text-primary' : 'text-gray-300 hover:text-gray-500'}>
                                                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center cursor-pointer text-gray-400 hover:text-primary" onClick={() => toggleRowExpand(item.containerNo)}>
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-800 font-mono text-base">
                                            {item.containerNo}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs italic">
                                            {/* Hidden visually mostly as grouped, but good for reference if printed */}
                                            Connects to: {item.customerReconciliation.substring(0, 15)}...
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500">
                                            {item.slipCount}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-orange-600 text-base">
                                            {item.totalPobAmount.toLocaleString()}
                                        </td>
                                        
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input 
                                                type="date" 
                                                className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={editForm.date}
                                                onChange={e => setEditForm({...editForm, date: e.target.value})}
                                                />
                                            ) : (
                                                item.refundDate ? new Date(item.refundDate).toLocaleDateString('vi-VN') : '-'
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            {isEditing ? (
                                                <div className="relative">
                                                    <input 
                                                    type="text" 
                                                    className="w-full min-w-[140px] text-right border border-blue-300 rounded px-3 py-2 text-base font-bold text-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                    value={editForm.amount ? Number(editForm.amount.replace(/\D/g, '')).toLocaleString() : ''}
                                                    onChange={e => setEditForm({...editForm, amount: e.target.value.replace(/\D/g, '')})}
                                                    placeholder="0"
                                                    autoFocus
                                                    />
                                                    <DollarSign size={14} className="absolute left-2 top-3 text-gray-400" />
                                                </div>
                                            ) : (
                                                <span className={item.refundAmount > 0 ? "font-bold text-green-700 text-base" : "text-gray-400"}>
                                                {item.refundAmount > 0 ? item.refundAmount.toLocaleString() : '-'}
                                                </span>
                                            )}
                                        </td>

                                        <td className={`px-4 py-3 text-right ${diffColor} text-base`}>
                                            {item.diffAmount !== 0 ? item.diffAmount.toLocaleString() : (item.refundAmount > 0 ? '0' : '-')}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            {isEditing ? (
                                                <div className="flex justify-center gap-2">
                                                <button onClick={() => saveEdit(item.containerNo)} className="text-green-600 hover:text-green-800 bg-green-100 p-2 rounded shadow-sm" title="Lưu">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 bg-gray-200 p-2 rounded shadow-sm" title="Hủy">
                                                    <RefreshCw size={18} />
                                                </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded text-xs font-bold border border-blue-200">
                                                {item.refundAmount > 0 ? 'Cập nhật' : 'Hoàn ứng'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={10} className="p-4 border-t border-gray-100 shadow-inner">
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden ml-10">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                                                            <tr>
                                                                <th className="p-2 border-b">Ngày chi</th>
                                                                <th className="p-2 border-b">BS Xe</th>
                                                                <th className="p-2 border-b">Ngày VC</th>
                                                                <th className="p-2 border-b">Tác nghiệp</th>
                                                                <th className="p-2 border-b">Kho</th>
                                                                <th className="p-2 border-b text-right">Số tiền</th>
                                                                <th className="p-2 border-b">Lý do / Ghi chú</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {item.slips.map((slip) => (
                                                                <tr key={slip.id} className="hover:bg-blue-50/20">
                                                                    <td className="p-2 font-medium text-blue-700">
                                                                        {new Date(slip.date).toLocaleDateString('vi-VN')}
                                                                    </td>
                                                                    <td className="p-2 font-bold">
                                                                        {slip.vehiclePlate}
                                                                    </td>
                                                                    <td className="p-2 text-gray-600">
                                                                        {slip.original?.date ? new Date(slip.original.date).toLocaleDateString('vi-VN') : '-'}
                                                                    </td>
                                                                    <td className="p-2">
                                                                        {slip.original?.operation || '-'}
                                                                    </td>
                                                                    <td className="p-2">
                                                                        {slip.original?.warehouse || '-'}
                                                                    </td>
                                                                    <td className="p-2 text-right font-bold text-red-600">
                                                                        {slip.amount.toLocaleString()} đ
                                                                    </td>
                                                                    <td className="p-2 italic text-gray-500 truncate max-w-[200px]">
                                                                        {slip.reason}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </React.Fragment>
                  );
              })}
              
              {combinedData.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">Không có dữ liệu phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RefundManagement;
