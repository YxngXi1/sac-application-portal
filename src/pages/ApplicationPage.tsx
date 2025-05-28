
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ApplicationFlow from '@/components/application/ApplicationFlow';

const ApplicationPage = () => {
  return (
    <ProtectedRoute>
      <ApplicationFlow />
    </ProtectedRoute>
  );
};

export default ApplicationPage;
