
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users as UsersIcon, 
  Fuel, 
  CalendarDays, 
  Menu, 
  X,
  LogOut,
  UserCircle,
  Wallet,
  Settings,
  BarChart3,
  Receipt,
  Disc,
  Gauge,
  Shield,
  DollarSign,
  Wrench,
  CreditCard,
  Book,
  Layers
} from 'lucide-react';
import { Role, UserAccount } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Assignments from './pages/Assignments';
import FuelPage from './pages/Fuel';
import Advances from './pages/Advances';
import Configuration from './pages/Configuration';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Salary from './pages/Salary';
import VehicleManagement from './pages/VehicleManagement';
import PayOnBehalfPage from './pages/PayOnBehalf';
import RefundManagement from './pages/RefundManagement';
import FinancialCategory from './pages/FinancialCategory';

// Navigation Item Type
type NavItem = 'dashboard' | 'resources' | 'assignments' | 'fuel' | 'advances' | 'expenses' | 'configuration' | 'reports' | 'vehicle-management' | 'users' | 'salary' | 'odometers' | 'tires' | 'pay-on-behalf' | 'refund-management' | 'financial-category';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('ADMIN'); // Default fallback, updated on login
  const [currentPage, setCurrentPage] = useState<NavItem>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPage]);

  const handleLogin = (role: Role, user: UserAccount) => {
    setCurrentRole(role);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRole('ADMIN'); // Reset to default
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard role={currentRole} onChangePage={setCurrentPage} />;
      // Routing old/standalone keys to the new Parent Containers with specific tabs
      case 'resources':
        return <Configuration role={currentRole} defaultTab="resources" />;
      case 'users':
        return <Configuration role={currentRole} defaultTab="users" />;
      case 'tires':
        return <VehicleManagement role={currentRole} defaultTab="tires" />;
      case 'odometers':
        return <VehicleManagement role={currentRole} defaultTab="odometers" />;
      
      // Standard Pages
      case 'vehicle-management':
        return <VehicleManagement role={currentRole} />;
      case 'configuration':
        return <Configuration role={currentRole} />;
      case 'financial-category':
        return <FinancialCategory role={currentRole} />;
        
      case 'assignments':
        return <Assignments role={currentRole} />;
      case 'fuel':
        return <FuelPage role={currentRole} />;
      case 'advances':
        return <Advances role={currentRole} />;
      case 'expenses':
        return <Expenses role={currentRole} />;
      case 'salary':
        return <Salary role={currentRole} />;
      case 'reports':
        return <Reports role={currentRole} />;
      case 'pay-on-behalf':
        return <PayOnBehalfPage role={currentRole} />;
      case 'refund-management':
        return <RefundManagement role={currentRole} />;
      default:
        return <Dashboard role={currentRole} onChangePage={setCurrentPage} />;
    }
  };

  const NavLink = ({ page, icon: Icon, label }: { page: NavItem; icon: any; label: string }) => {
    // Determine active state including child routes
    let isActive = currentPage === page;
    
    if (page === 'configuration' && (currentPage === 'resources' || currentPage === 'users')) {
      isActive = true;
    }
    if (page === 'vehicle-management' && (currentPage === 'tires' || currentPage === 'odometers')) {
      isActive = true;
    }

    return (
      <button
        onClick={() => setCurrentPage(page)}
        className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary text-white shadow-md font-bold' 
            : 'text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500'} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F7F7] flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center z-20 relative sticky top-0">
        <div className="flex items-center space-x-2 text-primary">
           <div className="p-1.5 bg-primary rounded-lg"><Truck className="h-5 w-5 text-white" /></div>
           <span className="font-bold text-lg">HIỆP PHÁT</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed md:sticky md:top-0 h-full w-72 bg-[#E7F4F2] border-r border-gray-200/50 shadow-xl md:shadow-none z-30 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 mb-2">
          <div className="flex items-center space-x-3 text-primary mb-6">
            <div className="bg-primary shadow-lg shadow-primary/30 p-2.5 rounded-xl">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl leading-none tracking-tight">HIỆP PHÁT</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Logistics</p>
            </div>
          </div>
          
          {/* User Profile Mini */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
             <div className="h-10 w-10 bg-gradient-to-tr from-primary to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {currentUser?.name.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{currentRole.toLowerCase()}</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-4">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu Chính</p>
          <NavLink page="dashboard" icon={LayoutDashboard} label="Tổng quan" />
          <NavLink page="assignments" icon={CalendarDays} label="Phân công" />
          <NavLink page="fuel" icon={Fuel} label="Nhiên liệu" />
          <NavLink page="advances" icon={Wallet} label="Phiếu Tạm Ứng" />
          <NavLink page="expenses" icon={Receipt} label="Chi phí Vận hành" />
          <NavLink page="vehicle-management" icon={Wrench} label="Quản lý Phương tiện" />
          <NavLink page="salary" icon={DollarSign} label="Lương Tài xế" />
          
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Hệ thống</p>
          <NavLink page="reports" icon={BarChart3} label="Báo cáo Tổng hợp" />

          {currentRole === 'ADMIN' && (
            <>
              <NavLink page="pay-on-behalf" icon={CreditCard} label="Quản lý Chi hộ" />
              <NavLink page="refund-management" icon={Layers} label="Quản lý Hoàn ứng" />
              <NavLink page="financial-category" icon={Book} label="Danh mục Tài chính" />
              <NavLink page="configuration" icon={Settings} label="Cấu hình Hệ thống" />
            </>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full space-x-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden bg-[#F0F7F7]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
          {renderPage()}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
