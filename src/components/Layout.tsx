import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Trophy, Home, Users, DollarSign, 
  Calendar, Globe, Zap, MapPin, LogOut 
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isNew?: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, isNew, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
        isActive 
          ? "bg-gray-800 text-white" 
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      )}
      onClick={onClick}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {isNew && (
        <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded">
          New
        </span>
      )}
    </Link>
  );
};

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    closeSidebar();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-[#1a1f2e] transform transition-transform duration-200 ease-in-out z-50',
          'lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Billiards Pro</h2>
            <button onClick={closeSidebar} className="lg:hidden">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem 
            to="/" 
            icon={<Home className="h-5 w-5" />} 
            label="Dashboard" 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/tournaments" 
            icon={<Trophy className="h-5 w-5" />} 
            label="Tournaments" 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/pricing" 
            icon={<DollarSign className="h-5 w-5" />} 
            label="Pricing" 
            isNew 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/leagues" 
            icon={<Globe className="h-5 w-5" />} 
            label="Leagues" 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/events" 
            icon={<Calendar className="h-5 w-5" />} 
            label="Events" 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/players" 
            icon={<Users className="h-5 w-5" />} 
            label="Players" 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/matches" 
            icon={<Zap className="h-5 w-5" />} 
            label="Matches" 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/venues" 
            icon={<MapPin className="h-5 w-5" />} 
            label="Venues" 
            onClick={closeSidebar}
          />
        </nav>

        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-red-400 hover:text-red-300 w-full px-4 py-2 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={clsx(
        'min-h-screen transition-all duration-200',
        'lg:ml-64'
      )}>
        <header className="bg-gray-800 p-4 lg:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">Billiards Pro</h1>
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">{user.email}</span>
              </div>
            ) : (
              <div className="w-6" /> /* Spacer for alignment */
            )}
          </div>
        </header>

        <main className="container mx-auto p-4">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}