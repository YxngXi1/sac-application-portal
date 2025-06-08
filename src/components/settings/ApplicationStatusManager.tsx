
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ApplicationSettings {
  acceptingApplications: boolean;
  applicationDeadline: Date | null;
  applicationOpenDate: Date | null;
  applicationMessage: string;
  interviewPeriod: {
    start: Date | null;
    end: Date | null;
  };
}

const ApplicationStatusManager: React.FC = () => {
  const [settings, setSettings] = useState<ApplicationSettings>({
    acceptingApplications: true,
    applicationDeadline: null,
    applicationOpenDate: null,
    applicationMessage: '',
    interviewPeriod: {
      start: null,
      end: null,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'applicationStatus'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({
          acceptingApplications: data.acceptingApplications ?? true,
          applicationDeadline: data.applicationDeadline?.toDate() || null,
          applicationOpenDate: data.applicationOpenDate?.toDate() || null,
          applicationMessage: data.applicationMessage || '',
          interviewPeriod: {
            start: data.interviewPeriod?.start?.toDate() || null,
            end: data.interviewPeriod?.end?.toDate() || null,
          },
        });
      }
    } catch (error) {
      console.error('Error loading application settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'applicationStatus'), {
        acceptingApplications: settings.acceptingApplications,
        applicationDeadline: settings.applicationDeadline,
        applicationOpenDate: settings.applicationOpenDate,
        applicationMessage: settings.applicationMessage,
        interviewPeriod: {
          start: settings.interviewPeriod.start,
          end: settings.interviewPeriod.end,
        },
        lastUpdated: new Date(),
      });
      console.log('Application settings saved successfully');
    } catch (error) {
      console.error('Error saving application settings:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading application settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Status Management</CardTitle>
          <CardDescription>
            Control when applications are accepted and manage application periods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>

          {/* Application Status */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Accept Applications</h3>
                  <p className="text-gray-600">Enable or disable new application submissions</p>
                </div>
                <Switch
                  checked={settings.acceptingApplications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, acceptingApplications: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Application Dates */}
          <Card className="border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Application Period</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Application Open Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {settings.applicationOpenDate ? 
                          format(settings.applicationOpenDate, 'PPP') : 
                          'Select date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={settings.applicationOpenDate}
                        onSelect={(date) => 
                          setSettings(prev => ({ ...prev, applicationOpenDate: date || null }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Application Deadline</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {settings.applicationDeadline ? 
                          format(settings.applicationDeadline, 'PPP') : 
                          'Select date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={settings.applicationDeadline}
                        onSelect={(date) => 
                          setSettings(prev => ({ ...prev, applicationDeadline: date || null }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Period */}
          <Card className="border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Interview Period</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Interview Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {settings.interviewPeriod.start ? 
                          format(settings.interviewPeriod.start, 'PPP') : 
                          'Select date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={settings.interviewPeriod.start}
                        onSelect={(date) => 
                          setSettings(prev => ({
                            ...prev,
                            interviewPeriod: { ...prev.interviewPeriod, start: date || null }
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Interview End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {settings.interviewPeriod.end ? 
                          format(settings.interviewPeriod.end, 'PPP') : 
                          'Select date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={settings.interviewPeriod.end}
                        onSelect={(date) => 
                          setSettings(prev => ({
                            ...prev,
                            interviewPeriod: { ...prev.interviewPeriod, end: date || null }
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Message */}
          <Card className="border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Application Message</h3>
              <p className="text-gray-600">Message shown to users on the application page</p>
              <Textarea
                placeholder="Enter a message for applicants (optional)"
                value={settings.applicationMessage}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, applicationMessage: e.target.value }))
                }
                rows={4}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationStatusManager;
