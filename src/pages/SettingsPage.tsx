
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import ApplicationSettingsSection from "@/components/settings/ApplicationSettingsSection";
import PositionsManagementSection from "@/components/settings/PositionsManagementSection";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const SettingsPage: React.FC = () => {
  const { userProfile } = useAuth();

  // Only teacher, pres, vp allowed
  const elevatedRoles = ["teacher", "pres", "vp"];
  const isSuperAdmin = userProfile?.email === "909957@pdsb.net";
  const isAllowed = isSuperAdmin || (userProfile && elevatedRoles.includes(userProfile.role));

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view the Control Center.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">🛠️ Admin Control Center</h1>
      <div className="space-y-8">
        <ApplicationSettingsSection />
        <PositionsManagementSection />
      </div>
    </div>
  );
};

export default SettingsPage;
