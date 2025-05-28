
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and title */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <img 
                src="/lovable-uploads/7008452c-9db1-439b-9d94-d68146b0c93b.png" 
                alt="SAC John Fraser" 
                className="h-8 w-auto sm:h-10 flex-shrink-0"
              />
              <h1 className="text-lg sm:text-xl font-semibold text-black truncate">
                SAC Application Portal
              </h1>
            </div>
            
            {/* User info and logout */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate max-w-32 lg:max-w-none">
                    {userProfile?.name}
                  </span>
                  <span className="text-xs text-white bg-blue-600 px-2 py-1 rounded-full flex-shrink-0">
                    {userProfile?.role}
                  </span>
                </div>
                
                {/* Mobile: Show only role badge */}
                <div className="sm:hidden">
                  <span className="text-xs text-white bg-blue-600 px-2 py-1 rounded-full">
                    {userProfile?.role}
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 p-2 h-8 w-8 sm:h-9 sm:w-9"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
