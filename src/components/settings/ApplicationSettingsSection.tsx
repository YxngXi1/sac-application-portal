
import React, { useEffect, useState } from "react";
import { getSACSettings, setSACSetting } from "@/services/settingsService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const ApplicationSettingsSection: React.FC = () => {
  const [acceptingApplications, setAcceptingApplications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSACSettings().then(settings => {
      setAcceptingApplications(!!settings.acceptingApplications);
      setLoading(false);
    });
  }, []);

  const toggleAccepting = async (checked: boolean) => {
    setLoading(true);
    try {
      await setSACSetting("acceptingApplications", checked);
      setAcceptingApplications(checked);
      toast({
        title: checked ? "Applications Opened" : "Applications Closed",
        description: checked
          ? "Applications are now being accepted."
          : "Applications have been closed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: (error as any).message || "Failed to update applications status."
      });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Status</CardTitle>
        <CardDescription>Toggle if the portal is open for new applications.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Switch
            checked={acceptingApplications}
            onCheckedChange={toggleAccepting}
            disabled={loading}
          />
          <span className={acceptingApplications ? "text-green-600" : "text-red-600"}>
            {acceptingApplications ? "Applications open" : "Applications closed"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationSettingsSection;
