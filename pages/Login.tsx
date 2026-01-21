
import React, { useState, useEffect } from 'react';
import { Truck, Lock, User, Clock } from 'lucide-react';
import { Role, UserAccount } from '../types';
import { DataService } from '../services/dataService';

interface LoginProps {
  onLogin: (role: Role, user: UserAccount) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = DataService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      if (user.isBlocked) {
        setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.');
      } else {
        onLogin(user.role, user);
      }
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.');
    }
  };

  const formatTime = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Truck size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">LOGISTICS HIỆP PHÁT</h1>
          <p className="text-gray-500 mt-2">Hệ thống quản lý vận hành</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-transform active:scale-95 shadow-lg shadow-primary/30"
          >
            Đăng nhập
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm font-medium text-gray-500 flex items-center justify-center">
            <Clock size={16} className="mr-2" />
            {formatTime(currentTime)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
