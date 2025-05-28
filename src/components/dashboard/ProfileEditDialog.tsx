
import React, { useState } from 'react';
import ProfileDialog from '@/components/ui/dialog-info';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const handleSave = async (newName: string, grade?: string) => {
    try {
      const updateData: any = { 
        fullName: newName,
        name: newName 
      };
      
      if (grade !== undefined) {
        updateData.grade = grade;
      }
      
      await updateUserProfile(updateData);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <ProfileDialog
      open={open}
      onOpenChange={onOpenChange}
      currentName={userProfile?.fullName || userProfile?.name || ''}
      currentGrade={userProfile?.grade || ''}
      onSave={handleSave}
    />
  );
};

export default ProfileEditDialog;
