
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    grade: userProfile?.grade || '',
    studentNumber: userProfile?.studentNumber || '',
    studentType: userProfile?.studentType || 'none'
  });

  const handleSave = async () => {
    try {
      await updateUserProfile({
        fullName: formData.fullName,
        name: formData.fullName,
        grade: formData.grade,
        studentNumber: formData.studentNumber,
        studentType: formData.studentType
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="studentNumber">Student Number</Label>
            <Input
              id="studentNumber"
              value={formData.studentNumber}
              onChange={(e) => handleInputChange('studentNumber', e.target.value)}
              placeholder="Enter your student number"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="grade">Grade</Label>
            <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="studentType">Program</Label>
            <Select value={formData.studentType} onValueChange={(value) => handleInputChange('studentType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Regular Program</SelectItem>
                <SelectItem value="IB">International Baccalaureate (IB)</SelectItem>
                <SelectItem value="AP">Advanced Placement (AP)</SelectItem>
                <SelectItem value="French Immersion">French Immersion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;