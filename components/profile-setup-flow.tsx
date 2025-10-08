'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/app/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, User, Lock, Shield } from 'lucide-react';
import KycVerification from '@/components/kyc-verification';

interface ProfileSetupFlowProps {
  onCompleted?: () => void;
}

const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({ onCompleted }) => {
  const router = useRouter();
  const { user } = useUser();
  const { profile, isProfileComplete, updateProfile, createProfile } = useProfile();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState<'basic' | 'pin' | 'kyc'>('basic');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: 'Ghana'
  });
  
  // PIN setup state
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phoneNumber: profile.phone_number || '',
        country: profile.country || 'Ghana'
      });
    }
  }, [profile]);

  useEffect(() => {
    if (isProfileComplete) {
      if (onCompleted) onCompleted();
    }
  }, [isProfileComplete, onCompleted]);

  const [savingBasic, setSavingBasic] = useState(false);

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBasic(true);
      if (!profile) {
        // Create profile using the context function (handles existing profiles)
        await createProfile();
        // Then update with the form data
        await updateProfile({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          country: formData.country
        });
      } else {
        // Update existing profile
        await updateProfile({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          country: formData.country
        });
      }
      setCurrentStep('pin');
    } finally {
      setSavingBasic(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setPinError('');
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleConfirmPinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    const newConfirmPin = [...confirmPin];
    newConfirmPin[index] = value;
    setConfirmPin(newConfirmPin);
    setPinError('');
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`confirm-pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PINs
    if (pin.some(digit => !digit)) {
      setPinError('Please enter a complete 4-digit PIN');
      return;
    }
    
    if (confirmPin.some(digit => !digit)) {
      setPinError('Please confirm your PIN');
      return;
    }
    
    if (pin.join('') !== confirmPin.join('')) {
      setPinError('PINs do not match');
      return;
    }
    
    try {
      setSavingPin(true);
      setPinError('');
      
      // Update profile with PIN
      await updateProfile({
        pin: pin.join('')
      });
      
      setCurrentStep('kyc');
    } catch (error) {
      console.error('Error setting PIN:', error);
      setPinError('Failed to set PIN. Please try again.');
    } finally {
      setSavingPin(false);
    }
  };

  const handlePinComplete = () => {
    setCurrentStep('kyc');
  };

  const handleKycComplete = () => {
    if (onCompleted) onCompleted();
    else router.refresh();
  };

  const getStepStatus = (step: string) => {
    if (!profile) return 'pending';
    switch (step) {
      case 'basic':
        return profile.first_name && profile.last_name && profile.email && profile.phone_number ? 'complete' : 'pending';
      case 'pin':
        return profile.pin ? 'complete' : 'pending';
      case 'kyc':
        return (profile.kyc_status === 'verified' || (profile.kyc_status as any) === 'complete') ? 'complete' : 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-xs" />
      <div className="relative z-[61] w-full max-w-full sm:max-w-2xl">
        <Card className="shadow-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-center text-lg sm:text-xl">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="flex justify-center mb-6">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {[
                  { id: 'basic', label: 'Basic Info', icon: User },
                  { id: 'pin', label: 'Security PIN', icon: Lock },
                  { id: 'kyc', label: 'KYC Verification', icon: Shield }
                ].map((step, index) => {
                  const Icon = step.icon;
                  const status = getStepStatus(step.id);
                  const isActive = currentStep === step.id;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                        status === 'complete' 
                          ? 'bg-green-600 border-green-600 text-white' 
                          : isActive 
                            ? 'bg-green-100 border-green-600 text-green-600' 
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}>
                        {status === 'complete' ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      <div className="ml-2">
                        <p className={`text-xs sm:text-sm font-medium ${
                          isActive ? 'text-green-600' : status === 'complete' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {index < 2 && (
                        <div className={`hidden sm:block w-8 h-0.5 mx-4 ${
                          getStepStatus(['basic', 'pin', 'kyc'][index + 1]) === 'complete' 
                            ? 'bg-green-600' 
                            : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {currentStep === 'basic' && (
              <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="0247899866"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                      <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                      <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                      <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base shadow-lg" disabled={savingBasic}>
                  {savingBasic ? 'Saving...' : 'Continue to Security Setup'}
                </Button>
              </form>
            )}

            {currentStep === 'pin' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600">
                    Set up a 4-digit PIN to secure your account and authorize transactions.
                  </p>
                </div>
                
                <form onSubmit={handlePinSubmit} className="space-y-6">
                  <div className="text-center">
                    <Label htmlFor="pin" className="text-center block mb-4 text-sm font-medium text-gray-700">Enter 4-digit PIN *</Label>
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((index) => (
                        <Input
                          key={index}
                          id={`pin-${index}`}
                          type="password"
                          maxLength={1}
                          value={pin[index]}
                          onChange={(e) => handlePinChange(index, e.target.value)}
                          className="text-center text-lg font-mono w-14 h-14 border-2 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <Label htmlFor="confirmPin" className="text-center block mb-4 text-sm font-medium text-gray-700">Confirm 4-digit PIN *</Label>
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((index) => (
                        <Input
                          key={index}
                          id={`confirm-pin-${index}`}
                          type="password"
                          maxLength={1}
                          value={confirmPin[index]}
                          onChange={(e) => handleConfirmPinChange(index, e.target.value)}
                          className="text-center text-lg font-mono w-14 h-14 border-2 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      ))}
                    </div>
                  </div>

                  {pinError && (
                    <div className="text-red-600 text-sm text-center">
                      {pinError}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base shadow-lg" 
                    disabled={pin.length !== 4 || confirmPin.length !== 4 || savingPin}
                  >
                    {savingPin ? 'Setting up PIN...' : 'Complete PIN Setup'}
                  </Button>
                </form>
              </div>
            )}

            {currentStep === 'kyc' && (
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Complete your identity verification to comply with regulations and unlock full account features.
                </p>
                <KycVerification onComplete={handleKycComplete} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetupFlow;


