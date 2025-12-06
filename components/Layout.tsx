import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, UserCircle, LogOut, ShieldCheck, Menu, X, Landmark, Bell, MessageCircle, Zap } from 'lucide-react';
import { MockAPI } from '../services/mockBackend';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
        if (user) {
            const count = await MockAPI.getUnreadNotificationCount(user.id);
            setUnreadCount(count);
        }
    };
    checkNotifications();
  }, [user, location.pathname]); // Refresh count on navigation

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Zap, label: 'Bills & Utilities', path: '/bills' },
    { icon: Landmark, label: 'Loans', path: '/loans' },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount },
    { icon: MessageCircle, label: 'Support', path: '/support' },
    { icon: UserCircle, label: 'KYC & Profile', path: '/kyc' },
  ];

  if (isAdmin) {
    navItems.push({ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-primary text-white p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Landmark className="w-6 h-6" /> NairaFlow
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="relative">
          {isMobileMenuOpen ? <X /> : <Menu />}
          {!isMobileMenuOpen && unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                 {unreadCount}
             </span>
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-gray-100 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
             <span className="text-white">Naira</span><span className="text-primary">Flow</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Banking for Everyone</p>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                isActive(item.path) 
                  ? 'bg-primary text-white shadow-md' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {item.badge ? (
                 <span className="absolute right-4 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                     {item.badge}
                 </span>
              ) : null}
            </Link>
          ))}
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 text-red-400 mt-8 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
           <div className="flex items-center gap-3">
             <img src={user?.avatar || "https://ui-avatars.com/api/?name=User"} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-primary" />
             <div className="overflow-hidden">
               <p className="text-sm font-semibold truncate">{user?.name}</p>
               <p className="text-xs text-gray-400 truncate">{user?.email}</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
           {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;