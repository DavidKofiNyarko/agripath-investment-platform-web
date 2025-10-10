'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import UserHeader from '@/components/user-header';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import KycModal from '@/components/kyc-modal';
import PinValidationModal from '@/components/pin-validation-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Filter, Plus, Minus, ChevronUp, ChevronDown, ArrowRight, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Bell, CreditCard, Trash2, CheckCircle, PartyPopper } from 'lucide-react';
import { logoutAllDevices } from '@/lib/authService';

function SettingsPage() {
  const { user } = useUser();
  const { profile, updateProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProfileSuccessOpen, setIsProfileSuccessOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    country: '',
    phone_number: ''
  });

  // Populate form with profile data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        country: profile.country || '',
        phone_number: profile.phone_number || ''
      });
    }
  }, [profile]);

  // Check if form has been modified
  const isFormModified = () => {
    if (!profile) return false;
    return (
      profileForm.first_name !== (profile.first_name || '') ||
      profileForm.last_name !== (profile.last_name || '') ||
      profileForm.email !== (profile.email || '') ||
      profileForm.country !== (profile.country || '') ||
      profileForm.phone_number !== (profile.phone_number || '')
    );
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    switch (tabId) {
      case 'profile':
        setActiveSubTab('personal');
        break;
      case 'security':
        setActiveSubTab('password');
        break;
      case 'notifications':
        setActiveSubTab('notifications');
        break;
      default:
        setActiveSubTab('personal');
    }
  };

  // const [showCurrentPin, setShowCurrentPin] = useState(false); // Unused
  // const [showNewPin, setShowNewPin] = useState(false); // Unused
  // const [showConfirmPin, setShowConfirmPin] = useState(false); // Unused

  const handleProfileUpdate = async () => {
    setIsUpdatingProfile(true);
    try {
      await updateProfile(profileForm);
      setIsProfileSuccessOpen(true);
      // Reset form to show updated values
      if (profile) {
        setProfileForm({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          country: profile.country || '',
          phone_number: profile.phone_number || ''
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // You could add error state here to show user feedback
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile & KYC', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const notificationSettings = [
    {
      id: 'email',
      title: 'Email Notifications',
      description: 'Get notified about important updates via email',
      enabled: true
    },
    {
      id: 'sms',
      title: 'SMS Notifications',
      description: 'Receive SMS alerts for critical account activities',
      enabled: false
    },
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Get real-time notifications on your device',
      enabled: true
    },
    {
      id: 'investment',
      title: 'Investment Updates',
      description: 'Notifications about your investment portfolio',
      enabled: true
    },
    {
      id: 'market',
      title: 'Market Updates',
      description: 'Stay informed about market trends and opportunities',
      enabled: false
    },
    {
      id: 'security',
      title: 'Security Alerts',
      description: 'Immediate alerts for security-related activities',
      enabled: true
    }
  ];

  const handleLogoutAllDevices = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    
    try {
      await logoutAllDevices();
      // The logoutAllDevices function handles the redirect
    } catch (error) {
      console.error('Logout all devices failed:', error);
      setLogoutError('Failed to logout from all devices. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <UserHeader 
          title="Settings" 
        />

        {/* Settings Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {settingsTabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  activeTab === tab.id 
                  ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
              <tab.icon className="h-4 w-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
            ))}
          </div>

        {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
            {/* Personal Information */}
            {activeSubTab === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture Display */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile Picture"
                          className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                          onError={(e) => {
                            // If image fails to load, show placeholder
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-4 border-gray-200 shadow-lg ${profile?.avatar_url ? 'hidden' : ''}`}>
                        <User className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {profileForm.first_name && profileForm.last_name 
                          ? `${profileForm.first_name} ${profileForm.last_name}`
                          : 'Profile Picture'
                        }
                      </h3>
                      <p className="text-sm text-gray-600">
                        {profile?.avatar_url ? 'Profile picture loaded' : 'No profile picture set'}
                      </p>
                  </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            value={profileForm.first_name} 
                        onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                        placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={profileForm.last_name} 
                        onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                        placeholder="Enter your last name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            type="email"
                            value={profileForm.email} 
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            placeholder="Enter your email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                      <Select onValueChange={(value) => setProfileForm({...profileForm, country: value})}>
                            <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                          <SelectItem value="ghana">Ghana</SelectItem>
                          <SelectItem value="nigeria">Nigeria</SelectItem>
                          <SelectItem value="kenya">Kenya</SelectItem>
                          <SelectItem value="south-africa">South Africa</SelectItem>
                          <SelectItem value="uganda">Uganda</SelectItem>
                          <SelectItem value="tanzania">Tanzania</SelectItem>
                          <SelectItem value="ethiopia">Ethiopia</SelectItem>
                          <SelectItem value="ivory-coast">Ivory Coast</SelectItem>
                          <SelectItem value="senegal">Senegal</SelectItem>
                          <SelectItem value="morocco">Morocco</SelectItem>
                          <SelectItem value="egypt">Egypt</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input 
                        id="phoneNumber"
                              value={profileForm.phone_number} 
                        onChange={(e) => setProfileForm({...profileForm, phone_number: e.target.value})}
                        placeholder="Enter your phone number"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleProfileUpdate}
                    disabled={isUpdatingProfile || !isFormModified()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating Profile...
                      </>
                    ) : !isFormModified() ? (
                      'No Changes Made'
                    ) : (
                      'Update Profile'
                    )}
                          </Button>
                </CardContent>
              </Card>
            )}

            {/* KYC Status */}
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                        <div>
                    <h3 className="font-semibold text-gray-900">Identity Verification</h3>
                    <p className="text-sm text-gray-600">
                      {profile?.kyc_status === 'verified' ? 'Your identity has been verified' : 'Complete your identity verification'}
                          </p>
                        </div>
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile?.kyc_status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile?.kyc_status === 'verified' ? 'Verified' : 'Pending'}
                    </div>
                    <Button
                      onClick={() => setIsKycModalOpen(true)}
                      variant={profile?.kyc_status === 'verified' ? 'outline' : 'default'}
                      className={profile?.kyc_status === 'verified' ? '' : 'bg-green-600 hover:bg-green-700'}
                    >
                      {profile?.kyc_status === 'verified' ? 'View Details' : 'Complete KYC'}
                    </Button>
                  </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Transaction PIN</h3>
                    <p className="text-sm text-gray-600">Secure your transactions with a 4-digit PIN</p>
                  </div>
                  <Button
                    onClick={() => setIsPinModalOpen(true)}
                    variant="outline"
                  >
                    Manage PIN
                  </Button>
              </div>

                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Logout All Devices</h3>
                    <p className="text-sm text-gray-600">Sign out from all devices and sessions</p>
                  </div>
                  <Button
                    onClick={handleLogoutAllDevices}
                    disabled={isLoggingOut}
                    variant="destructive"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging Out...
                      </>
                    ) : (
                      'Logout All Devices'
                    )}
                  </Button>
                </div>
                
                {logoutError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">{logoutError}</p>
                    </div>
                  </div>
                )}
                  </CardContent>
                </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                              <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{setting.title}</h3>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                              </div>
                              <Switch
                      checked={setting.enabled}
                                onCheckedChange={(checked) => {
                        // Handle notification toggle
                        console.log(`${setting.id} notifications:`, checked);
                                }}
                              />
                            </div>
                          ))}
                </CardContent>
              </Card>
            </div>
          )}

        {/* Modals */}
        <KycModal 
          isOpen={isKycModalOpen} 
          onClose={() => setIsKycModalOpen(false)}
          onCompleteKyc={() => {
            setIsKycModalOpen(false);
            // Handle KYC completion
          }}
        />
        
        <PinValidationModal 
          isOpen={isPinModalOpen} 
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={() => {
            setIsPinModalOpen(false);
            // Handle PIN validation success
          }}
        />

        {/* Profile Success Modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isProfileSuccessOpen ? 1 : 0 }}
          exit={{ opacity: 0 }}
        >
          {isProfileSuccessOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md mx-4"
              >
                <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                      duration: 0.6
                    }}
                    className="mb-4"
                  >
                    <PartyPopper className="h-16 w-16 text-green-600 mx-auto" />
                </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Profile Updated Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                    Your profile information has been updated and saved.
                  </p>
              <Button 
                    className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsProfileSuccessOpen(false)}
              >
                    Done
              </Button>
                </div>
            </motion.div>
          </div>
          )}
        </motion.div>
    </div>
    </DashboardLayout>
  );
}

export default SettingsPage;