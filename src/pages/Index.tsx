
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AvailablePositions from '@/pages/AvailablePositions';
import LandingPage from '@/components/landing/LandingPage';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, userProfile } = useAuth();

  // Show landing page if user is not signed in
  if (!user) {
    return <LandingPage />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {userProfile?.role === 'student' && <AvailablePositions />}
        {userProfile?.role === 'superadmin' && (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-black">Superadmin Dashboard</h1>
            <p className="text-black mt-2">Full system access - Coming soon...</p>
          </div>
        )}
        {userProfile?.role === 'exec' && (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-black">Executive Dashboard</h1>
            <p className="text-black mt-2">Coming soon...</p>
          </div>
        )}
        {userProfile?.role === 'teacher' && (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-black">Teacher Supervisor View</h1>
            <p className="text-black mt-2">Coming soon...</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Index;
