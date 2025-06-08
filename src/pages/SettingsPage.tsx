
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Users, FileText, Calendar, ToggleLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApplicationQuestionsManager from '@/components/settings/ApplicationQuestionsManager';
import InterviewQuestionsManager from '@/components/settings/InterviewQuestionsManager';
import UserPermissionsManager from '@/components/settings/UserPermissionsManager';
import ApplicationStatusManager from '@/components/settings/ApplicationStatusManager';

const SettingsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Only superadmins can access this page
  if (!userProfile || userProfile.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            System Settings
          </h1>
          <p className="text-gray-600">
            Manage application questions, interviews, user permissions, and system status
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Application Questions
            </TabsTrigger>
            <TabsTrigger value="interviews" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Interview Questions
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Permissions
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <ToggleLeft className="h-4 w-4" />
              Application Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <ApplicationQuestionsManager />
          </TabsContent>

          <TabsContent value="interviews">
            <InterviewQuestionsManager />
          </TabsContent>

          <TabsContent value="permissions">
            <UserPermissionsManager />
          </TabsContent>

          <TabsContent value="status">
            <ApplicationStatusManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
