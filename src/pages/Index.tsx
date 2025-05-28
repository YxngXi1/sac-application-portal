
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/components/landing/LandingPage';
import ApplicationDashboard from '@/components/dashboard/ApplicationDashboard';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  // Show landing page if user is not signed in
  if (!user) {
    return <LandingPage />;
  }

  return (
    <ProtectedRoute>
      <ApplicationDashboard />
    </ProtectedRoute>
  );
};

export default Index;
