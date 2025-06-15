import React, { useEffect, useState } from "react";
import { getSACRoles, setSACRole, getSACSettings, setSACSetting, SACRoleAssignment, RoleType } from "@/services/settingsService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<RoleType, string> = {
  teacher: "Teacher",
  pres: "President",
  vp: "Vice President",
  tech: "Tech",
  exec: "Executive",
  guest: "Guest"
};

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [roles, setRoles] = useState<SACRoleAssignment[]>([]);
  const [settings, setSettings] = useState<{ acceptingApplications: boolean }>({ acceptingApplications: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Protect: Only teacher/pres/vp
  const isAdmin = userProfile && ["teacher", "pres", "vp"].includes(userProfile.role);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      getSACRoles().then(setRoles),
      getSACSettings().then(setSettings)
    ]).catch(err => setError((err as any).message)).finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You do not have permission to view the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Accepting Applications</CardTitle>
          <CardDescription>
            Toggle whether the portal is open to new applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Switch
              checked={!!settings.acceptingApplications}
              onCheckedChange={async (val) => {
                setSaving(true);
                try {
                  await setSACSetting("acceptingApplications", val);
                  setSettings((cur) => ({ ...cur, acceptingApplications: val }));
                } catch (e: any) {
                  setError(e.message || "Error updating setting");
                }
                setSaving(false);
              }}
              disabled={saving}
            />
            <span className={settings.acceptingApplications ? "text-green-600" : "text-red-600"}>
              {settings.acceptingApplications ? "Applications open" : "Applications closed"}
            </span>
          </div>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SAC Roles Management</CardTitle>
          <CardDescription>
            Assign or change roles for council members. (Only Teacher can assign Pres/Vp)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.length === 0 && <p className="text-sm text-gray-600">No SAC role assignments found.</p>}
            {roles.map((r) => (
              <div key={r.uid} className="flex justify-between items-center border-b py-2">
                <div>
                  <span className="font-semibold">{r.displayName || r.email}</span>
                  <Badge className="ml-2">{roleLabels[r.role]}</Badge>
                </div>
                <div>
                  <select
                    value={r.role}
                    onChange={async (e) => {
                      const newRole = e.target.value as RoleType;
                      setSaving(true);
                      try {
                        await setSACRole(r.uid, newRole, r.positions);
                        setRoles((old) =>
                          old.map(item => item.uid === r.uid ? { ...item, role: newRole } : item)
                        );
                      } catch (e: any) {
                        setError(e.message || "Error updating role");
                      }
                      setSaving(false);
                    }}
                    disabled={saving || (userProfile.role !== "teacher" && (r.role === "pres" || r.role === "vp"))}
                    className="bg-white border px-2 py-1 rounded"
                  >
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            This is an early version; please double-check permission hierarchy before making role changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
