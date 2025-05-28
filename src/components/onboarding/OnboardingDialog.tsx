
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ open, onComplete }) => {
  const { updateUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    grade: '',
    studentType: 'none' as 'AP' | 'SHSM' | 'none'
  });

  const stepContent = [
    {
      title: "Welcome to SAC Applications",
      description: "Before you apply, we need some basic details about you.",
    },
    {
      title: "Personal Information",
      description: "Please provide your full name and student number.",
    },
    {
      title: "Academic Information",
      description: "Tell us about your grade and academic program.",
    },
  ];

  const totalSteps = stepContent.length;

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    try {
      await updateUserProfile({
        fullName: formData.fullName,
        studentNumber: formData.studentNumber,
        grade: formData.grade,
        studentType: formData.studentType,
        isOnboarded: true,
      });
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const isStep2Valid = formData.fullName.trim() !== '' && formData.studentNumber.trim() !== '';
  const isStep3Valid = formData.grade.trim() !== '';

  return (
    <Dialog open={open}>
      <DialogContent className="gap-0 p-0 [&>button:last-child]:text-white sm:max-w-[500px]">
        <div className="p-4">
          <div className="w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-16 w-16 text-white" />
          </div>
        </div>
        <div className="space-y-6 px-6 pb-6 pt-3">
          <DialogHeader>
            <DialogTitle>{stepContent[step - 1].title}</DialogTitle>
            <DialogDescription>{stepContent[step - 1].description}</DialogDescription>
          </DialogHeader>

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentNumber">Student Number</Label>
                <Input
                  id="studentNumber"
                  placeholder="Enter your student number"
                  value={formData.studentNumber}
                  onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData({ ...formData, grade: value })}
                >
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
              
              <div className="space-y-2">
                <Label>Academic Program</Label>
                <RadioGroup
                  value={formData.studentType}
                  onValueChange={(value) => setFormData({ ...formData, studentType: value as 'AP' | 'SHSM' | 'none' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AP" id="ap" />
                    <Label htmlFor="ap">Advanced Placement (AP)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SHSM" id="shsm" />
                    <Label htmlFor="shsm">Specialist High Skills Major (SHSM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">None</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-primary",
                    index + 1 === step ? "bg-primary" : "opacity-20",
                  )}
                />
              ))}
            </div>
            <DialogFooter>
              {step < totalSteps ? (
                <Button 
                  className="group" 
                  type="button" 
                  onClick={handleContinue}
                  disabled={(step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid)}
                >
                  Next
                  <ArrowRight
                    className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Button>
              ) : (
                <Button type="button" onClick={handleComplete}>
                  Complete Setup
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
