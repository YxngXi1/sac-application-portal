
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/components/landing/LandingPage';
import ApplicationDashboard from '@/components/dashboard/ApplicationDashboard';
import OnboardingDialog from '@/components/onboarding/OnboardingDialog';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, userProfile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && userProfile && !userProfile.isOnboarded) {
      setShowOnboarding(true);
    }
  }, [user, userProfile]);

  // Show landing page if user is not signed in
  if (!user) {
    return <LandingPage />;
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <ProtectedRoute>
      <ApplicationDashboard />
      <OnboardingDialog 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete}
      />
    </ProtectedRoute>
  );
};

export default Index;
