import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, LayoutDashboard, FileText, Vote } from 'lucide-react';



export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <ShieldCheck className="h-8 w-8 text-primary transition-transform group-hover:scale-110 duration-300" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-secondary rounded-full animate-pulse-slow"></div>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">VoteGuard</span>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 hidden md:block">
                  Signed in as <span className="font-semibold text-gray-900">{user.name}</span> ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-500 hover:text-danger hover:bg-red-50 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      


      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} VoteGuard Systems. All rights reserved. Secure & Auditable.
        </div>
      </footer>
    </div>
  );
};

