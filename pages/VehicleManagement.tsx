
import React, { useState, useEffect } from 'react';
import { Truck, Disc, Gauge } from 'lucide-react';
import { Role } from '../types';
import Tires from './Tires';
import Odometers from './Odometers';

interface VehicleManagementProps {
  role: Role;
  defaultTab?: 'tires' | 'odometers';
}

const VehicleManagement: React.FC<VehicleManagementProps> = ({ role, defaultTab = 'tires' }) => {
  const [activeTab, setActiveTab] = useState<'tires' | 'odometers'>(defaultTab);

  // Sync activeTab if defaultTab changes (e.g. navigation from sidebar/dashboard)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-primary-dark flex items-center">
          <Truck className="mr-2" /> Quản lý Phương tiện
        </h2>
        <p className="text-gray-500">Theo dõi thông số kỹ thuật, lốp và lịch sử vận hành của xe.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tires')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${
            activeTab === 'tires' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Disc size={18} className="mr-2" /> Quản lý Lốp & Thay vỏ
          {activeTab === 'tires' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        
        {/* Only show Odometer tab for ADMIN */}
        {role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('odometers')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative flex items-center whitespace-nowrap ${
              activeTab === 'odometers' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
             <Gauge size={18} className="mr-2" /> Quản lý Km (ODO)
            {activeTab === 'odometers' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'tires' && <Tires role={role} />}
        {role === 'ADMIN' && activeTab === 'odometers' && <Odometers role={role} />}
      </div>
    </div>
  );
};

export default VehicleManagement;
