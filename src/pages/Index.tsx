
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {userProfile?.role === 'student' && <StudentDashboard />}
        {userProfile?.role === 'superadmin' && (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900">Superadmin Dashboard</h1>
            <p className="text-gray-600 mt-2">Full system access - Coming soon...</p>
          </div>
        )}
        {userProfile?.role === 'exec' && (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        )}
        {userProfile?.role === 'teacher' && (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900">Teacher Supervisor View</h1>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Index;
