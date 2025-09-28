'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard-layout';
import UserHeader from '@/components/user-header';
import { useProjects, Project } from '@/contexts/ProjectsContext';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import KycModal from '@/components/kyc-modal';
import PinValidationModal from '@/components/pin-validation-modal';
import { createClient } from '@/app/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  X,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Investment {
  id: string;
  name: string;
  image: string;
  price: number;
  roi: string;
  duration: string;
  unitsAvailable: number;
  totalUnits: number;
  description: string;
}


// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  hover: { 
    y: -2,
    transition: { duration: 0.2 }
  }
};

const stepVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.4 }
  },
  exit: { 
    opacity: 0, 
    x: -20, 
    transition: { duration: 0.3 }
  }
};

const progressVariants = {
  hidden: { scaleX: 0 },
  visible: { 
    scaleX: 1, 
    transition: { duration: 0.6 }
  }
};


const InvestmentsPage = () => {
  const { user } = useUser();
  const { profile } = useProfile();
  const supabase = createClient();
  const { 
    projects, 
    loading, 
    error, 
    filters, 
    setFilters, 
    refreshProjects,
    pagination,
    setPagination
  } = useProjects();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showAbout, setShowAbout] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  
  // Multi-step flow state
  const [currentStep, setCurrentStep] = useState('details'); // details, review, payment, process, success
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    mobileNumber: '',
    provider: 'MTN',
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    savePayment: false
  });
  const [pin, setPin] = useState(['', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Update project units in database
  const updateProjectUnits = async (projectId: string, quantity: number, totalAmount: number) => {
    try {
      // Get current project data first
      const { data: projectData, error: fetchError } = await supabase
        .from('projects')
        .select('available_unit, purchased_unit')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;

      // Update available_unit and purchased_unit in projects table
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          available_unit: projectData.available_unit - quantity,
          purchased_unit: projectData.purchased_unit + quantity
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id, // Use auth user ID
          project_id: projectId,
          type: 'Payin',
          amount: totalAmount,
          unit: quantity,
          status: 'Completed',
          fees: 0.0, // Ensure it's a number, not integer
          net_amount: totalAmount,
          description: `Investment in project ${projectId}`,
          channel: selectedPaymentMethod === 'mobile' ? 'momo' : 'card', // Ensure it's a string
          account_number: paymentDetails.mobileNumber || paymentDetails.cardNumber || 'N/A',
          redirect_url: `${window.location.origin}/dashboard` // Add required redirect_url
        });

      if (transactionError) throw transactionError;
    } catch (error) {
      console.error('Failed to update project units:', error);
      throw error;
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  // Handle search with optimization
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Only trigger search if value is empty, has 4+ characters, or user hits enter
    if (value.length === 0 || value.length >= 4) {
      setFilters({ ...filters, search: value });
    }
  };

  // Handle search button click or enter key
  const handleSearchSubmit = () => {
    setFilters({ ...filters, search: searchQuery });
  };

  // Handle enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({ ...filters, search: '' });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading investment opportunities...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Projects</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshProjects} className="bg-green-600 hover:bg-green-700">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleInvestmentClick = (project: Project) => {
    // Check KYC status before allowing investment
    if (profile?.kyc_status !== 'verified') {
      setShowKycModal(true);
      return;
    }

    // Convert project to investment format for the existing flow
    const investment = {
      id: project.id,
      name: project.project_name,
      type: project.project_type,
      location: project.farm_location,
      price: project.unit_price,
      roi: `${project.expected_return_rate}%`,
      duration: `${project.duration_months} months`,
      available: project.available_unit,
      totalUnits: project.total_units,
      unitsAvailable: project.available_unit,
      image: project.cover_image_url,
      progress: Math.round((project.purchased_unit / project.total_units) * 100),
      description: project.description || 'No description available'
    };
    setSelectedInvestment(investment);
    setQuantity(1);
    setShowAbout(false);
    setCurrentStep('details');
    setIsSheetOpen(true);
    resetFlow();
  };

  const resetFlow = () => {
    setAgreedToTerms(false);
    setSelectedPaymentMethod('');
    setPaymentDetails({
      mobileNumber: '',
      provider: 'MTN',
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      savePayment: false
    });
    setPin(['', '', '', '']);
    setIsProcessing(false);
  };

  const handleCompleteKyc = () => {
    setShowKycModal(false);
    window.location.href = '/kyc-verification';
  };

  const calculateTotal = () => {
    return selectedInvestment ? selectedInvestment.price * quantity : 0;
  };

  const calculateExpectedReturn = () => {
    if (!selectedInvestment) return '0 - 0';
    const total = calculateTotal();
    
    // Handle both "15-25%" and "15%" formats
    if (selectedInvestment.roi.includes('-')) {
      const [minROI, maxROI] = selectedInvestment.roi.split('-').map(r => parseInt(r.replace('%', '')));
      const minReturn = Math.floor(total * (minROI / 100));
      const maxReturn = Math.floor(total * (maxROI / 100));
      return `${minReturn} - ${maxReturn}`;
    } else {
      // Single ROI value
      const roi = parseInt(selectedInvestment.roi.replace('%', ''));
      const expectedReturn = Math.floor(total * (roi / 100));
      return `${expectedReturn}`;
    }
  };

  const handleInvestNow = () => {
    setCurrentStep('review');
  };

  const handleContinueToPayment = () => {
    setCurrentStep('payment');
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const handleInvestmentSubmit = async () => {
    if (!selectedInvestment || !user) {
      console.error('Missing investment or user data');
      return;
    }

    // Validate payment details based on selected method
    if (selectedPaymentMethod === 'mobile') {
      if (!paymentDetails.mobileNumber || !paymentDetails.provider) {
        alert('Please fill in all mobile money details');
        return;
      }
    } else if (selectedPaymentMethod === 'card') {
      if (!paymentDetails.cardName || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        alert('Please fill in all card details');
        return;
      }
    } else {
      alert('Please select a payment method');
      return;
    }

    // Show PIN modal for validation
    setShowPinModal(true);
  };

  const handleInvestmentPinSuccess = async () => {
    if (!selectedInvestment || !user || !profile) return;
    
    setShowPinModal(false);
    setCurrentStep('process');
    setIsProcessing(true);
    
    try {
      const totalAmount = selectedInvestment.price * quantity;
      const projectId = selectedInvestment.id;
      const userId = user?.id; // Use auth user ID
      
      // Debug logging
      console.log('Debug Info:', {
        authUserId: user?.id,
        profileId: profile?.id,
        profileUserId: profile?.user_id,
        projectId: projectId,
        totalAmount: totalAmount,
        quantity: quantity
      });
      
      let paymentPayload;
      let paymentUrl;
      
      if (selectedPaymentMethod === 'mobile') {
        // Mobile Money Payment
        paymentUrl = 'https://infra.agripath.co/api/payments/momo/payin';
        paymentPayload = {
          user_id: userId,
          project_id: projectId,
          subscriber_number: paymentDetails.mobileNumber,
          network: paymentDetails.provider,
          description: `Investment in ${selectedInvestment.name}`,
          amount: totalAmount,
          unit: quantity
        };
      } else if (selectedPaymentMethod === 'card') {
        // Card Payment
        paymentUrl = 'https://infra.agripath.co/api/payments/card/payin';
        paymentPayload = {
          user_id: userId,
          project_id: projectId,
          amount: totalAmount,
          unit: quantity,
          desc: `Investment in ${selectedInvestment.name}`,
          pan: paymentDetails.cardNumber.replace(/\s/g, ''),
          exp_month: paymentDetails.expiryDate.split('/')[0],
          exp_year: paymentDetails.expiryDate.split('/')[1],
          cvv: paymentDetails.cvv,
          card_holder: paymentDetails.cardName,
          user_email: user.email || '',
          redirect_url: `${window.location.origin}/dashboard`
        };
      } else {
        throw new Error('Invalid payment method selected');
      }
      
      console.log('Payment URL:', paymentUrl);
      console.log('Payment Payload:', paymentPayload);
      
      // Make the payment API call
      const response = await fetch(paymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload)
      });
      
      if (!response.ok) {
        throw new Error(`Payment failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Payment result:', result);
      
      // Update project units in database
      await updateProjectUnits(projectId, quantity, totalAmount);
      
      // Simulate processing delay
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep('success');
        // Reset form after successful payment
        resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep('error');
      }, 2000);
    }
  };

  const resetForm = () => {
    setQuantity(1);
    setSelectedPaymentMethod('');
    setPaymentDetails({
      mobileNumber: '',
      provider: 'MTN',
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      savePayment: false
    });
    setPin(['', '', '', '']);
    setAgreedToTerms(false);
  };


  return (
    <DashboardLayout>
      <div className={`space-y-6 transition-all duration-300 ${isSheetOpen ? 'main-content-blur' : ''}`}>
        {/* Header */}
        <UserHeader />

        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Explore Investments</h2>
          {filters.search && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Search: &quot;{filters.search}&quot;
              </Badge>
              <Button
                onClick={handleClearSearch}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>


        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects... (min 4 characters)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className={`pl-10 pr-24 ${searchQuery.length > 0 && searchQuery.length < 4 ? 'border-orange-300 bg-orange-50' : ''}`}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                {searchQuery.length > 0 && (
                  <Button
                    onClick={handleClearSearch}
                    className="h-8 w-8 p-0"
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={handleSearchSubmit}
                  disabled={searchQuery.length < 4 && searchQuery.length > 0}
                  className="h-8 px-3 text-sm"
                  variant="ghost"
                  size="sm"
                >
                  Search
                </Button>
              </div>
              {searchQuery.length > 0 && searchQuery.length < 4 && (
                <p className="absolute -bottom-6 left-0 text-xs text-orange-600">
                  Type {4 - searchQuery.length} more character{4 - searchQuery.length === 1 ? '' : 's'} to search
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="CROP">Crops</SelectItem>
                      <SelectItem value="LIVESTOCK">Livestock</SelectItem>
                      <SelectItem value="FISHERY">Fishery</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <Select value={filters.duration} onValueChange={(value) => handleFilterChange('duration', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Short (1-3 months)">Short (1-3 months)</SelectItem>
                      <SelectItem value="Medium (4-8 months)">Medium (4-8 months)</SelectItem>
                      <SelectItem value="Long (9+ months)">Long (9+ months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Return (ROI)</Label>
                  <Select value={filters.returnRate} onValueChange={(value) => handleFilterChange('returnRate', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Low (5-15%)">Low (5-15%)</SelectItem>
                      <SelectItem value="Medium (16-25%)">Medium (16-25%)</SelectItem>
                      <SelectItem value="High (26%+)">High (26%+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Min Amount</Label>
                  <Input
                    placeholder="GHS 1,000"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Amount</Label>
                  <Input
                    placeholder="GHS 10,000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Investment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later</p>
              </div>
            </div>
          ) : (
            projects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="overflow-hidden cursor-pointer group h-full hover:shadow-lg transition-shadow duration-200">
                <div className="relative">
                  <img 
                    src={project.cover_image_url}
                    alt={project.project_name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-3 right-3 bg-green-600 hover:bg-green-700">
                    {project.project_type}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{project.project_name}</h3>
                    </div>
                    <p className="text-gray-600 mb-1">{project.farm_location}</p>
                    <p className="text-gray-600 mb-3">GHS {project.unit_price.toLocaleString()} <span className="text-sm">/Per Unit</span></p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                      <span>Return (ROI)</span>
                      <span>Duration</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-orange-600">{project.expected_return_rate}%</span>
                      <span className="font-semibold text-orange-600">{project.duration_months} months</span>
                    </div>

                    <div className="mb-4">
                      <div className="relative">
                        <Progress 
                          value={(project.purchased_unit / project.total_units) * 100} 
                          className="h-2"
                        />
                        <motion.div
                          className="absolute top-0 left-0 h-2 bg-green-600 rounded-full"
                          variants={progressVariants}
                          initial="hidden"
                          animate="visible"
                          style={{ 
                            width: `${(project.purchased_unit / project.total_units) * 100}%`,
                            transformOrigin: 'left'
                          }}
                        />
                      </div>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        {project.available_unit} Units Available
                      </p>
                    </div>

                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 group"
                      onClick={() => handleInvestmentClick(project)}
                    >
                      Invest Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {projects.length > 0 && (
          <div className="flex items-center justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.currentPage === page ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        pagination.currentPage === page 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'text-gray-600'
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Investment Details Side Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
            <SheetTitle className="sr-only">Investment Details</SheetTitle>
            {selectedInvestment && (
              <AnimatePresence mode="wait">
                {/* Step 1: Investment Details */}
                {currentStep === 'details' && (
                  <motion.div
                    key="details"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    <div className="h-full flex flex-col">
                    <SheetHeader className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold">{selectedInvestment.name}</SheetTitle>
                        <Badge className="bg-green-600">AVAILABLE</Badge>
                      </div>
                    </SheetHeader>
                    
                    <div className="flex-1 p-6 space-y-6">
                      <img 
                        src={selectedInvestment.image}
                        alt={selectedInvestment.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Price per Unit</p>
                          <p className="font-bold text-lg">GHS {selectedInvestment.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Return (ROI)</p>
                          <p className="font-bold text-lg text-orange-600">{selectedInvestment.roi}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-bold text-lg text-orange-600">{selectedInvestment.duration}</p>
                        </div>
                      </div>

                      <div>
                        <Progress 
                          value={(selectedInvestment.unitsAvailable / selectedInvestment.totalUnits) * 100} 
                          className="h-2"
                        />
                        <p className="text-sm text-green-600 font-medium mt-1">
                          {selectedInvestment.unitsAvailable} Units Available
                        </p>
                      </div>

                      <div>
                        <Button
                          variant="ghost"
                          onClick={() => setShowAbout(!showAbout)}
                          className="w-full justify-between p-0 h-auto"
                        >
                          <span className="font-semibold">About Project</span>
                          {showAbout ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {showAbout && (
                          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                            {selectedInvestment.description}
                          </p>
                        )}
                      </div>

                        <div className="space-y-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="font-semibold">Unit Quantity</Label>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold text-lg w-8 text-center">
                                {quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setQuantity(Math.min(selectedInvestment.unitsAvailable, quantity + 1))}
                                disabled={quantity >= selectedInvestment.unitsAvailable}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount</span>
                          <span className="font-bold">GHS {calculateTotal().toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected Return</span>
                          <span className="font-bold text-green-600">GHS {calculateExpectedReturn()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t bg-gray-50 flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleInvestNow}
                      >
                        Invest Now
                      </Button>
                    </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Review Investment */}
                {currentStep === 'review' && (
                  <motion.div
                    key="review"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full flex flex-col"
                  >
                    {/* Progress Steps */}
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('details')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <motion.div 
                          className="flex items-center"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <motion.div 
                            className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium"
                            whileHover={{ scale: 1.1 }}
                          >
                            1
                          </motion.div>
                          <span className="ml-2 text-sm font-medium text-green-600">Review</span>
                        </motion.div>
                        <motion.div 
                          className="w-8 h-0.5 bg-gray-300"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        ></motion.div>
                        <motion.div 
                          className="flex items-center"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
                            2
                          </div>
                          <span className="ml-2 text-sm text-gray-500">Payment</span>
                        </motion.div>
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <motion.div 
                          className="flex items-center"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
                            3
                          </div>
                          <span className="ml-2 text-sm text-gray-500">Process</span>
                        </motion.div>
                      </div>

                      <div className="text-center">
                        <h2 className="text-xl font-semibold">Review Your Investment</h2>
                        <p className="text-gray-600 text-sm mt-1">Secure your spot in our current farm projects in just a few steps.</p>
                      </div>
                    </div>

                    <div className="flex-1 p-6 space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project</span>
                          <span className="font-semibold">{selectedInvestment.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ROI</span>
                          <span className="font-semibold">{selectedInvestment.roi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected Return</span>
                          <span className="font-semibold">GHS {calculateExpectedReturn()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Units Selected</span>
                          <span className="font-semibold">{quantity} Unit(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount</span>
                          <span className="font-semibold">GHS {calculateTotal().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-semibold">{selectedInvestment.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Starting</span>
                          <span className="font-semibold">November 2025</span>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-semibold mb-3">Terms and Agreement</h3>
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="terms"
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="terms" className="text-sm text-gray-700">
                              I agree to the investment terms and understand the risks involved.
                            </label>
                            <Button variant="link" className="p-0 h-auto text-green-600 text-sm">
                              Read More...
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t bg-gray-50">
                      <p className="text-xs text-gray-500 text-center mb-4">
                        Review your investment details carefully before proceeding.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setCurrentStep('details')}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={handleContinueToPayment}
                          disabled={!agreedToTerms}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment Method Selection */}
                {currentStep === 'payment' && (
                  <motion.div
                    key="payment"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full flex flex-col"
                  >
                    {/* Progress Steps */}
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('review')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="ml-2 text-sm text-gray-500">Review</span>
                        </div>
                        <div className="w-8 h-0.5 bg-green-600"></div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                            2
                          </div>
                          <span className="ml-2 text-sm font-medium text-green-600">Payment</span>
                        </div>
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
                            3
                          </div>
                          <span className="ml-2 text-sm text-gray-500">Process</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <h2 className="text-xl font-semibold">Choose Your Payment Method</h2>
                        <p className="text-gray-600 text-sm mt-1">Select how you&apos;d like to pay for this investment.</p>
                        <p className="text-gray-600 text-sm">All payments are processed securely.</p>
                      </div>
                    </div>

                    <div className="flex-1 p-6 space-y-4">
                      <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodSelect}>
                        {/* AgriPath Account */}
                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                          <RadioGroupItem value="agripath" id="agripath" />
                          <div className="flex-1">
                            <Label htmlFor="agripath" className="font-medium">Agripath Account</Label>
                            <p className="text-sm text-red-500">Available Balance: GHS 0.00</p>
                          </div>
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-6 h-6 bg-green-600 rounded-full"></div>
                          </div>
                        </div>

                        {/* Mobile Money */}
                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                          <RadioGroupItem value="mobile" id="mobile" />
                          <div className="flex-1">
                            <Label htmlFor="mobile" className="font-medium">Mobile Money</Label>
                            <p className="text-sm text-gray-500">Pay with MoMo</p>
                          </div>
                          <div className="flex gap-2">
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0ZGQ0MwMCIvPgo8dGV4dCB4PSIxMiIgeT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TVROPC90ZXh0Pgo8L3N2Zz4K" alt="MTN" className="w-6 h-6" />
                            <div className="w-6 h-6 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                            <div className="w-6 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                          </div>
                        </div>

                        {/* Bank Card */}
                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                          <RadioGroupItem value="card" id="card" />
                          <div className="flex-1">
                            <Label htmlFor="card" className="font-medium">Bank Card</Label>
                            <p className="text-sm text-gray-500">Pay with Mastercard & Visa</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-8 h-5 bg-gradient-to-r from-red-500 to-yellow-500 rounded"></div>
                            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                          </div>
                        </div>
                      </RadioGroup>

                      {selectedPaymentMethod === 'mobile' && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Select services provider</Label>
                            <Select value={paymentDetails.provider} onValueChange={(value) => setPaymentDetails({...paymentDetails, provider: value})}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MTN">MTN</SelectItem>
                                <SelectItem value="Vodafone">Vodafone</SelectItem>
                                <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Phone number</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-green-100">
                                <span className="text-sm">🇬🇭 +233</span>
                              </div>
                              <Input
                                placeholder="Eg. 55 567 8905"
                                value={paymentDetails.mobileNumber}
                                onChange={(e) => setPaymentDetails({...paymentDetails, mobileNumber: e.target.value})}
                                className="rounded-l-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-green-100 rounded">
                            <span className="text-sm font-medium">Should we save this MoMo number?</span>
                            <Switch
                              checked={paymentDetails.savePayment}
                              onCheckedChange={(checked) => setPaymentDetails({...paymentDetails, savePayment: checked})}
                            />
                          </div>
                        </div>
                      )}

                      {selectedPaymentMethod === 'card' && (
                        <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Cardholder Name</Label>
                            <Input
                              placeholder="Amanda"
                              value={paymentDetails.cardName}
                              onChange={(e) => setPaymentDetails({...paymentDetails, cardName: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Card number</Label>
                            <div className="relative mt-1">
                              <Input
                                placeholder="0000 0000 0000 0000"
                                value={paymentDetails.cardNumber}
                                onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
                                <div className="w-6 h-4 bg-gradient-to-r from-red-500 to-yellow-500 rounded"></div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Expiry Date</Label>
                              <Input
                                placeholder="00/00"
                                value={paymentDetails.expiryDate}
                                onChange={(e) => setPaymentDetails({...paymentDetails, expiryDate: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">CVC/CVV</Label>
                              <Input
                                placeholder="000"
                                value={paymentDetails.cvv}
                                onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
                            <span className="text-sm font-medium">Save this payment method</span>
                            <Switch
                              checked={paymentDetails.savePayment}
                              onCheckedChange={(checked) => setPaymentDetails({...paymentDetails, savePayment: checked})}
                            />
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <p className="text-sm text-orange-800">
                            You can manage or change your accounts anytime in Settings &gt; Payout Accounts.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t bg-gray-50 flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setCurrentStep('review')}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleInvestmentSubmit}
                        disabled={!selectedPaymentMethod || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Invest Now'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Processing */}
                {currentStep === 'process' && (
                  <motion.div
                    key="process"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full flex flex-col items-center justify-center p-6"
                  >
                    <div className="flex items-center justify-center space-x-4 mb-8">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="ml-2 text-sm text-gray-500">Review</span>
                      </div>
                      <div className="w-8 h-0.5 bg-green-600"></div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="ml-2 text-sm text-gray-500">Payment</span>
                      </div>
                      <div className="w-8 h-0.5 bg-green-600"></div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <span className="ml-2 text-sm font-medium text-green-600">Process</span>
                      </div>
                    </div>

                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 mx-auto">
                        <Loader2 className="w-16 h-16 animate-spin text-green-600" />
                      </div>
                      
                      <div>
                        <h2 className="text-2xl font-semibold mb-2">Processing...</h2>
                        <p className="text-gray-600 mb-4">
                            Hang tight! We&apos;re confirming your payment with your provider. This usually takes a few seconds.
                        </p>
                        <p className="text-sm text-gray-500">
                          You will receive a USSD prompt in <span className="font-medium">00:30s</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Success */}
                {currentStep === 'success' && (
                  <motion.div
                    key="success"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                      {/* Enhanced Confetti Animation */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute"
                            initial={{ 
                              y: -100, 
                              x: Math.random() * window.innerWidth,
                              rotate: 0,
                              opacity: 1
                            }}
                            animate={{ 
                              y: window.innerHeight + 100,
                              rotate: 360,
                              opacity: 0
                            }}
                            transition={{
                              duration: Math.random() * 3 + 2,
                              delay: Math.random() * 2,
                              ease: "easeOut"
                            }}
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`
                            }}
                          >
                            <motion.div 
                              className={`w-3 h-3 ${
                                ['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 6)]
                              }`}
                              animate={{ 
                                rotate: [0, 45, 90, 135, 180],
                                scale: [1, 1.2, 1, 0.8, 1]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              style={{
                                borderRadius: Math.random() > 0.5 ? '50%' : '0%'
                              }}
                            />
                          </motion.div>
                        ))}
                      </div>

                      <div className="text-center space-y-6 relative z-10">
                        <motion.div 
                          className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 200, 
                            damping: 15,
                            delay: 0.2 
                          }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                          >
                            <Check className="w-10 h-10 text-green-600" />
                          </motion.div>
                        </motion.div>
                        
                        <div>
                          <h2 className="text-2xl font-semibold mb-2">Investment Successful</h2>
                          <p className="text-gray-600">
                            Your investment in <span className="font-medium">{selectedInvestment.name}</span> is confirmed.
                          </p>
                        </div>

                        <div className="space-y-4 text-left bg-gray-50 p-4 rounded-lg">
                          <div className="text-center mb-4">
                            <p className="text-sm text-gray-600 mb-1">Total Payment</p>
                            <p className="text-3xl font-bold">GHS {calculateTotal().toLocaleString()}</p>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Project</span>
                              <span className="font-medium">{selectedInvestment.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Expected Return</span>
                              <span className="font-medium">GHS {calculateExpectedReturn()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Units Selected</span>
                              <span className="font-medium">{quantity} Unit(s)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration</span>
                              <span className="font-medium">{selectedInvestment.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Starting</span>
                              <span className="font-medium">November 2025</span>
                            </div>
                          </div>
                        </div>

                        <Button variant="link" className="text-green-600 underline">
                          Download Receipt
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 border-t bg-gray-50 space-y-3">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setIsSheetOpen(false);
                          // Navigate to portfolio
                        }}
                      >
                        View My Portfolio
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setIsSheetOpen(false);
                          setCurrentStep('details');
                          resetFlow();
                        }}
                      >
                        Explore Other Investments
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 6: Error */}
                {currentStep === 'error' && (
                  <motion.div
                    key="error"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full flex flex-col items-center justify-center p-6"
                  >
                    <div className="text-center space-y-6">
                      <motion.div 
                        className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 200, 
                          damping: 15,
                          delay: 0.2 
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                        >
                          <AlertTriangle className="w-10 h-10 text-red-600" />
                        </motion.div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h2 className="text-2xl font-semibold mb-2">Oops!</h2>
                        <p className="text-gray-600">
                          We couldn&apos;t complete your payment.
                        </p>
                        <p className="text-gray-600">
                          Try again or use a different account.
                        </p>
                      </motion.div>
                    </div>

                    <div className="mt-8 w-full">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setCurrentStep('payment');
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </SheetContent>
        </Sheet>

        {/* KYC Modal */}
        <KycModal
          isOpen={showKycModal}
          onClose={() => setShowKycModal(false)}
          onCompleteKyc={handleCompleteKyc}
        />

        {/* PIN Validation Modal */}
        <PinValidationModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handleInvestmentPinSuccess}
          title="Confirm Investment"
          description="Enter your 4-digit PIN to confirm this investment transaction"
          action="Confirm Investment"
        />
      </div>
    </DashboardLayout>
  );
};

export default InvestmentsPage;
