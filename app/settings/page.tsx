'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard-layout';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import PasswordChange from '@/components/password-change';
import PinChange from '@/components/pin-change';
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  ChevronDown, 
  Key, 
  Eye, 
  EyeOff,
  Trash2,
  Check,
  X,
  Upload,
  AlertTriangle,
  PartyPopper
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useUser();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('personal');

  // Reset sub-tab when main tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Set default sub-tab for each main tab
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
      case 'payment':
        setActiveSubTab('payment');
        break;
      default:
        setActiveSubTab('personal');
    }
  };

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isPinConfirmOpen, setIsPinConfirmOpen] = useState(false);
  const [isPinSetOpen, setIsPinSetOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isProfileSuccessOpen, setIsProfileSuccessOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    country: '',
    phone_number: ''
  });

  // Initialize profile form when profile data loads
  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        country: profile.country || 'Ghana',
        phone_number: profile.phone_number || ''
      });
    }
  }, [profile]);

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileUpdate = async () => {
    try {
      setIsUpdatingProfile(true);
      await updateProfile(profileForm);
      setIsProfileSuccessOpen(true);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  const [paymentDetails, setPaymentDetails] = useState({
    networkProvider: '',
    phoneNumber: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const settingsTabs = [
    { id: 'profile', label: 'Profile & KYC', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment Method', icon: CreditCard }
  ];

  const profileSubTabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'kyc', label: 'KYC Verification', icon: Key }
  ];

  const securitySubTabs = [
    { id: 'password', label: 'Password' },
    { id: 'pin', label: 'Change Transaction PIN' },
    { id: 'logout', label: 'Logout All Devices' }
  ];

  const notificationCategories = [
    {
      title: 'Investment & Portfolio',
      items: [
        { id: 'investment-updates', label: 'Investment Updates', description: 'Get updates when your crops/livestock are started, growth stages, or harvested.', enabled: true },
        { id: 'roi-alerts', label: 'ROI & Payout Alerts', description: 'Be notified when your returns are ready or payouts are sent.', enabled: true }
      ]
    },
    {
      title: 'App & System',
      items: [
        { id: 'app-announcements', label: 'App Announcements', description: 'Stay informed about new features and updates.', enabled: false },
        { id: 'security-alerts', label: 'Security Alerts', description: 'Get notified if there&apos;s a login from a new device or account changes.', enabled: true }
      ]
    },
    {
      title: 'Promotions & Marketing',
      items: [
        { id: 'offers', label: 'Offers & Promotions', description: 'Occasional offers, bonuses, and news from AgriPath.', enabled: true }
      ]
    }
  ];

  const paymentMethods = [
    {
      id: 1,
      type: 'Mobile Money',
      provider: 'MTN Mobile Money',
      name: 'Michael Conway',
      number: '053 000 0000',
      logo: 'MTN',
      color: 'bg-yellow-500'
    },
    {
      id: 2,
      type: 'Bank Account',
      provider: 'Fidelity Bank Ghana Limited',
      name: 'Michael Conway',
      number: '000 000 000 000',
      logo: 'F',
      color: 'bg-orange-500'
    },
    {
      id: 3,
      type: 'Bank Card',
      provider: 'Mastercard',
      name: 'Michael Conway',
      number: '1234 1234 1234 1234',
      expiry: '02/28',
      cvv: '356',
      logo: 'MC',
      color: 'bg-red-500'
    }
  ];

  const handlePinChange = (index: number, value: string, pinType: 'pin' | 'newPin' | 'confirmPin') => {
    if (value.length > 1) return;
    
    const pinArray = pinType === 'pin' ? pin : pinType === 'newPin' ? newPin : confirmPin;
    const setPinArray = pinType === 'pin' ? setPin : pinType === 'newPin' ? setNewPin : setConfirmPin;
    
    const newPinArray = [...pinArray];
    newPinArray[index] = value;
    setPinArray(newPinArray);
    
    if (value && index < 3) {
      const nextInput = document.getElementById(`${pinType}-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleAddWallet = () => {
    if (selectedPaymentMethod === 'mobile') {
      setIsPinConfirmOpen(true);
    } else {
      setIsPinSetOpen(true);
    }
  };

  const handlePinConfirm = () => {
    setIsPinConfirmOpen(false);
    setIsSuccessOpen(true);
  };

  const handlePinSet = () => {
    setIsPinSetOpen(false);
    setIsSuccessOpen(true);
  };

  const handleDeletePaymentMethod = (id: number) => {
    // Handle deletion logic
    console.log('Delete payment method:', id);
  };

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Thursday, 18 September 2025 • 05:53 PM GMT
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8">
            {settingsTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-3 ${
                  activeTab === tab.id 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Profile & KYC Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarImage 
                        src={profile?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar_url} 
                        alt="Profile picture"
                      />
                      <AvatarFallback>
                        {profile?.first_name?.[0] || user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
                      }
                    </h2>
                    <p className="text-gray-600">
                      {user?.created_at 
                        ? `Joined ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                        : 'Member'
                      }
                    </p>
                    <Badge 
                      variant={
                        profile?.kyc_status === 'verified' ? 'default' : 
                        profile?.kyc_status === 'pending' ? 'secondary' : 
                        'destructive'
                      }
                      className={`mt-2 ${
                        profile?.kyc_status === 'verified' ? 'bg-green-600 hover:bg-green-700' : 
                        profile?.kyc_status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                        'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {profile?.kyc_status === 'verified' ? 'KYC Verified' : 
                       profile?.kyc_status === 'pending' ? 'KYC Pending' : 
                       'KYC Incomplete'}
                    </Badge>
                  </div>

                  {/* Sub Navigation */}
                  <div className="flex space-x-1 mb-6">
                    {profileSubTabs.map((subTab) => (
                      <Button
                        key={subTab.id}
                        variant={activeSubTab === subTab.id ? 'default' : 'ghost'}
                        onClick={() => setActiveSubTab(subTab.id)}
                        className={`px-4 py-2 ${
                          activeSubTab === subTab.id 
                            ? 'bg-green-600 text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <subTab.icon className="h-4 w-4 mr-2" />
                        {subTab.label}
                      </Button>
                    ))}
                  </div>

                  {/* Personal Information */}
                  {activeSubTab === 'personal' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            value={profileForm.first_name} 
                            onChange={(e) => handleProfileInputChange('first_name', e.target.value)}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={profileForm.last_name} 
                            onChange={(e) => handleProfileInputChange('last_name', e.target.value)}
                            placeholder="Enter last name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            value={user?.email || ''} 
                            readOnly 
                            className="bg-gray-50" 
                          />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Select 
                            value={profileForm.country} 
                            onValueChange={(value) => handleProfileInputChange('country', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                              <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                              <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                              <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="flex">
                            <Select disabled>
                              <SelectTrigger className="w-20 bg-gray-50">
                                <SelectValue placeholder="+233" />
                              </SelectTrigger>
                            </Select>
                            <Input 
                              id="phone" 
                              value={profileForm.phone_number} 
                              onChange={(e) => handleProfileInputChange('phone_number', e.target.value)}
                              placeholder="000 000 0000"
                              className="ml-2"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Save Button */}
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleProfileUpdate}
                          disabled={isUpdatingProfile}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* KYC Verification */}
                  {activeSubTab === 'kyc' && (
                    <div className="space-y-6">
                      {/* KYC Status Overview */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Identity Verification Status</h3>
                          <div className="flex items-center gap-2">
                            {profile?.kyc_status === 'verified' ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <Check className="h-5 w-5" />
                                <span className="text-sm font-medium">Verified</span>
                              </div>
                            ) : profile?.kyc_status === 'pending' ? (
                              <div className="flex items-center gap-2 text-yellow-600">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="text-sm font-medium">Under Review</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <X className="h-5 w-5" />
                                <span className="text-sm font-medium">Not Started</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                          {profile?.kyc_status === 'verified' 
                            ? 'Your identity has been successfully verified. You can now make investments and withdrawals.'
                            : profile?.kyc_status === 'pending'
                            ? 'Your documents are being reviewed by our team. This usually takes 1-2 business days.'
                            : 'Complete your identity verification to unlock full access to investments and payouts.'
                          }
                        </p>

                        {/* KYC Documents Status */}
                        {profile?.kyc_documents && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">Uploaded Documents</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  profile.kyc_documents.id_front ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">National ID Front</p>
                                  <p className="text-xs text-gray-500">
                                    {profile.kyc_documents.id_front ? 'Uploaded' : 'Not uploaded'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  profile.kyc_documents.id_back ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">National ID Back</p>
                                  <p className="text-xs text-gray-500">
                                    {profile.kyc_documents.id_back ? 'Uploaded' : 'Not uploaded'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  profile.kyc_documents.selfie ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Selfie</p>
                                  <p className="text-xs text-gray-500">
                                    {profile.kyc_documents.selfie ? 'Uploaded' : 'Not uploaded'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {profile?.kyc_status !== 'verified' && (
                          <Button
                            onClick={() => {
                              if (profile?.kyc_status === 'pending') {
                                // For pending status, just scroll to KYC section or stay on profile
                                setActiveSubTab('kyc');
                              } else {
                                // For not started, go to verification page
                                window.location.href = '/kyc-verification';
                              }
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {profile?.kyc_status === 'pending' ? 'View Verification Status' : 'Start Verification'}
                          </Button>
                        )}
                        
                        {profile?.kyc_status === 'verified' && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              window.location.href = '/kyc-verification';
                            }}
                            className="flex-1"
                          >
                            View Documents
                          </Button>
                        )}
                      </div>

                      {/* Information Box */}
                      <div className={`rounded-lg p-4 flex items-start ${
                        profile?.kyc_status === 'verified' 
                          ? 'bg-green-50 border border-green-200' 
                          : profile?.kyc_status === 'pending'
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-blue-50 border border-blue-200'
                      }`}>
                        <AlertTriangle className={`h-5 w-5 mt-0.5 mr-3 ${
                          profile?.kyc_status === 'verified' 
                            ? 'text-green-600' 
                            : profile?.kyc_status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            profile?.kyc_status === 'verified' 
                              ? 'text-green-800' 
                              : profile?.kyc_status === 'pending'
                              ? 'text-yellow-800'
                              : 'text-blue-800'
                          }`}>
                            {profile?.kyc_status === 'verified' 
                              ? 'Verification Complete'
                              : profile?.kyc_status === 'pending'
                              ? 'Verification in Progress'
                              : 'Verification Required'
                            }
                          </p>
                          <p className={`text-sm ${
                            profile?.kyc_status === 'verified' 
                              ? 'text-green-700' 
                              : profile?.kyc_status === 'pending'
                              ? 'text-yellow-700'
                              : 'text-blue-700'
                            }`}>
                            {profile?.kyc_status === 'verified' 
                              ? 'You can now make investments and withdrawals without restrictions.'
                              : profile?.kyc_status === 'pending'
                              ? 'We are reviewing your documents. You will be notified once verification is complete.'
                              : 'Complete your identity verification to unlock full access to investments and payouts.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Edit Profile Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Sub Navigation */}
              <div className="flex space-x-1 mb-6">
                {securitySubTabs.map((subTab) => (
                  <Button
                    key={subTab.id}
                    variant={activeSubTab === subTab.id ? 'default' : 'ghost'}
                    onClick={() => setActiveSubTab(subTab.id)}
                    className={`px-4 py-2 ${
                      activeSubTab === subTab.id 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {subTab.label}
                  </Button>
                ))}
              </div>

              {/* Password Section */}
              {activeSubTab === 'password' && (
                <PasswordChange />
              )}

              {/* Transaction PIN Section */}
              {activeSubTab === 'pin' && (
                <PinChange />
              )}

              {/* Logout All Devices Section */}
              {activeSubTab === 'logout' && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Logout All Devices</h3>
                    <p className="text-gray-600 mb-4">
                      For security reasons, you can log out of all devices where your AgriPath account is currently active.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-800 text-sm">
                        This will log you out everywhere, including this device. You&apos;ll need to sign in again.
                      </p>
                    </div>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                      Logout All Devices
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Notifications</h3>
                  <div className="space-y-6">
                    {notificationCategories.map((category, categoryIndex) => (
                      <div key={category.title}>
                        <h4 className="text-green-600 font-semibold mb-4">{category.title}</h4>
                        <div className="space-y-4">
                          {category.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{item.label}</h5>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                              <Switch
                                checked={item.enabled}
                                onCheckedChange={(checked) => {
                                  // Handle toggle logic
                                  console.log(`${item.id}: ${checked}`);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        {categoryIndex < notificationCategories.length - 1 && (
                          <div className="border-t border-gray-200 mt-6"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Method Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Payment Methods</h3>
                  
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-12 w-12 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Wallet Added</h4>
                      <p className="text-gray-600 mb-6">
                        You haven&apos;t added any payment methods yet. Add one to start investing, topping up, or withdrawing funds.
                      </p>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setIsAddWalletOpen(true)}
                      >
                        Add New Wallet
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 ${method.color} rounded-full flex items-center justify-center text-white font-bold`}>
                                {method.logo}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                <p className="text-lg font-bold text-gray-900">{method.number}</p>
                                <p className="text-sm text-gray-600">{method.provider}</p>
                                {method.expiry && (
                                  <p className="text-sm text-gray-600">
                                    Expiry Date - {method.expiry} • CVC/CVV - {method.cvv}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePaymentMethod(method.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setIsAddWalletOpen(true)}
                      >
                        Add New Wallet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Add New Wallet Modal */}
      <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Which payment method would you like to add?</p>
            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <div className="space-y-3">
                <div className={`border rounded-lg p-4 ${selectedPaymentMethod === 'mobile' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile" className="flex-1 cursor-pointer">Mobile Money</Label>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  {selectedPaymentMethod === 'mobile' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="networkProvider">Select network provider</Label>
                        <Select onValueChange={(value) => setPaymentDetails({...paymentDetails, networkProvider: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Eg. MTN" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mtn">MTN</SelectItem>
                            <SelectItem value="vodafone">Vodafone</SelectItem>
                            <SelectItem value="airteltigo">AirtelTigo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber">Phone number</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                            <span className="text-sm text-gray-600">🇬🇭 +233</span>
                          </div>
                          <Input
                            id="phoneNumber"
                            placeholder="Eg. 55 567 8905"
                            value={paymentDetails.phoneNumber}
                            onChange={(e) => setPaymentDetails({...paymentDetails, phoneNumber: e.target.value})}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`border rounded-lg p-4 ${selectedPaymentMethod === 'bank' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">Bank Account</Label>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  {selectedPaymentMethod === 'bank' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="bankName">Select Bank</Label>
                        <Select onValueChange={(value) => setPaymentDetails({...paymentDetails, bankName: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Eg. Fidelity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                            <SelectItem value="gcb">GCB Bank</SelectItem>
                            <SelectItem value="absa">Absa Bank</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                          id="accountName"
                          placeholder="John Doe"
                          value={paymentDetails.accountName}
                          onChange={(e) => setPaymentDetails({...paymentDetails, accountName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="0000 0000 0000 0000"
                          value={paymentDetails.accountNumber}
                          onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={`border rounded-lg p-4 ${selectedPaymentMethod === 'card' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">Bank Card</Label>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  {selectedPaymentMethod === 'card' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentDetails.cardNumber}
                          onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={paymentDetails.expiryDate}
                            onChange={(e) => setPaymentDetails({...paymentDetails, expiryDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={paymentDetails.cvv}
                            onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleAddWallet}
              disabled={!selectedPaymentMethod}
            >
              Add New Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Confirmation Modal */}
      <Dialog open={isPinConfirmOpen} onOpenChange={setIsPinConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm with Transaction PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Enter your 4-digit PIN to confirm this action.</p>
            <div className="flex space-x-2 justify-center">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  id={`confirm-pin-${index}`}
                  type="password"
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, 'pin')}
                  className="w-12 text-center text-lg"
                  maxLength={1}
                />
              ))}
            </div>
            <p className="text-sm text-red-600 text-center">
              This extra step helps keep your payment methods secure.
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePinConfirm}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Set Modal */}
      <Dialog open={isPinSetOpen} onOpenChange={setIsPinSetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>PIN not set yet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Secure your account — create a Transaction PIN. This will be used for withdrawals and sensitive actions.
            </p>
            <div className="space-y-4">
              <div>
                <Label>New PIN</Label>
                <div className="flex space-x-2 mt-2">
                  {newPin.map((digit, index) => (
                    <Input
                      key={index}
                      id={`set-new-pin-${index}`}
                      type="password"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value, 'newPin')}
                      className="w-12 text-center text-lg"
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Confirm PIN</Label>
                <div className="flex space-x-2 mt-2">
                  {confirmPin.map((digit, index) => (
                    <Input
                      key={index}
                      id={`set-confirm-pin-${index}`}
                      type="password"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value, 'confirmPin')}
                      className="w-12 text-center text-lg"
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Choose a 4-digit PIN you&apos;ll remember. Do not share it with anyone.
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePinSet}
            >
              Confirm PIN
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Success</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-4"
            >
              <PartyPopper className="h-16 w-16 text-green-600 mx-auto" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Congratulations your payout MoMo number has been successfully added!
            </h3>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsSuccessOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Success Modal */}
      <Dialog open={isProfileSuccessOpen} onOpenChange={setIsProfileSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Profile Updated Successfully</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.1
              }}
              className="mb-6"
            >
              <div className="relative">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="absolute -top-1 -right-1 h-6 w-6 bg-green-600 rounded-full flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Profile Updated Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your profile information has been saved and updated across the platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                className="bg-green-600 hover:bg-green-700 w-full"
                onClick={() => setIsProfileSuccessOpen(false)}
              >
                Continue
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default SettingsPage;