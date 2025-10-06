'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // CardHeader, CardTitle unused
// import { Input } from '@/components/ui/input'; // Unused import
// import { Label } from '@/components/ui/label'; // Unused import
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  Check, 
  AlertTriangle, 
  X, 
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  // CreditCard, // Unused import
  Shield
} from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';

interface KycVerificationProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const KycVerification: React.FC<KycVerificationProps> = ({ onComplete, onSkip }) => {
  const { profile, refreshProfile } = useProfile();
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Document states
  const [idFront, setIdFront] = useState<string | null>(profile?.kyc_documents?.id_front || null);
  const [idBack, setIdBack] = useState<string | null>(profile?.kyc_documents?.id_back || null);
  const [selfie, setSelfie] = useState<string | null>(profile?.kyc_documents?.selfie || null);
  
  // File input refs
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 1, title: 'National ID Front', icon: FileText, description: 'Upload front of your National ID' },
    { id: 2, title: 'National ID Back', icon: FileText, description: 'Upload back of your National ID' },
    { id: 3, title: 'Selfie Photo', icon: User, description: 'Take a clear selfie photo' },
    { id: 4, title: 'Review & Submit', icon: Check, description: 'Review documents and submit' }
  ];

  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG and PNG files are allowed');
      return false;
    }
    
    return true;
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error: _error } = await supabase.storage
        .from('project-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        setError(`Failed to upload file: ${error}`);
        return null;
      }

      if (!data) {
        setError('Upload failed: No data returned');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload file');
      return null;
    }
  };

  const handleFileUpload = async (file: File, type: 'id_front' | 'id_back' | 'selfie') => {
    if (!validateFile(file)) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const fileName = `${profile?.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      const url = await uploadFile(file, fileName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (url) {
        if (type === 'id_front') setIdFront(url);
        else if (type === 'id_back') setIdBack(url);
        else if (type === 'selfie') setSelfie(url);
        
        setSuccess(`${type.replace('_', ' ')} uploaded successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: 'id_front' | 'id_back' | 'selfie') => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const removeDocument = (type: 'id_front' | 'id_back' | 'selfie') => {
    if (type === 'id_front') setIdFront(null);
    else if (type === 'id_back') setIdBack(null);
    else if (type === 'selfie') setSelfie(null);
  };

  const handleSubmitKyc = async () => {
    if (!idFront || !idBack || !selfie) {
      setError('Please upload all required documents');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { error: _error } = await supabase
        .from('profile')
        .update({
          kyc_status: 'pending',
          kyc_documents: {
            id_front: idFront,
            id_back: idBack,
            selfie: selfie
          }
        })
        .eq('user_id', user?.id);

      if (error) {
        setError('Failed to submit KYC. Please try again.');
        return;
      }

      setSuccess('KYC submitted successfully! We will review your documents.');
      await refreshProfile();
      
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    } catch (error) {
      setError('Failed to submit KYC. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => {
    // Check if current step is completed before allowing next
    if (currentStep === 1 && !idFront) {
      setError('Please upload your National ID front before proceeding.');
      return;
    }
    if (currentStep === 2 && !idBack) {
      setError('Please upload your National ID back before proceeding.');
      return;
    }
    if (currentStep === 3 && !selfie) {
      setError('Please take a selfie photo before proceeding.');
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError(''); // Clear any previous errors
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload National ID Front</h3>
              <p className="text-gray-600">Please upload a clear photo of the front of your National ID card</p>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'id_front')}
            >
              {idFront ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-600 font-medium">National ID Front uploaded successfully!</p>
                  <Button
                    variant="outline"
                    onClick={() => removeDocument('id_front')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 mb-2">Drag and drop your National ID front here, or</p>
                    <Button
                      onClick={() => idFrontRef.current?.click()}
                      disabled={uploading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Supports: JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>

            <input
              ref={idFrontRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'id_front');
                }
              }}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload National ID Back</h3>
              <p className="text-gray-600">Please upload a clear photo of the back of your National ID card</p>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'id_back')}
            >
              {idBack ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-600 font-medium">National ID Back uploaded successfully!</p>
                  <Button
                    variant="outline"
                    onClick={() => removeDocument('id_back')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 mb-2">Drag and drop your National ID back here, or</p>
                    <Button
                      onClick={() => idBackRef.current?.click()}
                      disabled={uploading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Supports: JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>

            <input
              ref={idBackRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'id_back');
                }
              }}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Take Selfie Photo</h3>
              <p className="text-gray-600">Please take a clear selfie photo for identity verification</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => cameraRef.current?.click()}
                  disabled={uploading}
                  className="h-20 bg-green-600 hover:bg-green-700 flex flex-col items-center justify-center"
                >
                  <Camera className="w-6 h-6 mb-2" />
                  Take Photo
                </Button>
                
                <Button
                  onClick={() => selfieRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Upload className="w-6 h-6 mb-2" />
                  Upload Photo
                </Button>
              </div>

              {selfie ? (
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-600 font-medium">Selfie uploaded successfully!</p>
                  <Button
                    variant="outline"
                    onClick={() => removeDocument('selfie')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500 text-sm">No selfie uploaded yet</p>
                </div>
              )}
            </div>

            <input
              ref={selfieRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'selfie');
                }
              }}
            />

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'selfie');
                }
              }}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Documents</h3>
              <p className="text-gray-600">Please review your uploaded documents before submitting</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className={`w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                    idFront ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {idFront ? (
                      <Check className="w-8 h-8 text-green-600" />
                    ) : (
                      <X className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="font-medium">National ID Front</p>
                  <p className="text-sm text-gray-500">
                    {idFront ? 'Uploaded' : 'Not uploaded'}
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className={`w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                    idBack ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {idBack ? (
                      <Check className="w-8 h-8 text-green-600" />
                    ) : (
                      <X className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="font-medium">National ID Back</p>
                  <p className="text-sm text-gray-500">
                    {idBack ? 'Uploaded' : 'Not uploaded'}
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className={`w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                    selfie ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {selfie ? (
                      <Check className="w-8 h-8 text-green-600" />
                    ) : (
                      <X className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="font-medium">Selfie Photo</p>
                  <p className="text-sm text-gray-500">
                    {selfie ? 'Uploaded' : 'Not uploaded'}
                  </p>
                </div>
              </div>

              {(!idFront || !idBack || !selfie) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="text-yellow-800 text-sm">
                      Please upload all required documents before submitting.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Background */}
      <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Desktop Only */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-4">Identity Verification</h1>
                <p className="text-xl text-green-100 leading-relaxed">
                  Complete your KYC verification to unlock full access to investments and secure transactions.
                </p>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>National ID verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Selfie photo capture</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Secure document storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Full investment access</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold">KYC Verification</h1>
                  <p className="text-green-100 text-sm">Step {currentStep} of 4</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center p-6 lg:p-12">
            <div className="max-w-md mx-auto w-full">
              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  {steps.map((step, _index) => (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep >= step.id 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs mt-2 text-center hidden sm:block">
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
                <Progress value={(currentStep / 4) * 100} className="h-2" />
              </div>

              {/* Step Content */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Upload Progress */}
              {uploading && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                  >
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800 text-sm">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                    disabled={uploading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}

                {currentStep < 4 ? (
                  <Button
                    onClick={nextStep}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={uploading || (currentStep === 1 && !idFront) || (currentStep === 2 && !idBack) || (currentStep === 3 && !selfie)}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitKyc}
                    disabled={uploading || !idFront || !idBack || !selfie}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {uploading ? 'Submitting...' : 'Submit KYC'}
                  </Button>
                )}
              </div>

              {/* Skip Button */}
              {onSkip && (
                <div className="text-center mt-4">
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={uploading}
                  >
                    Skip for now
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden bg-white/10 backdrop-blur-sm border-t border-white/20 px-6 py-4">
            <p className="text-center text-green-100 text-sm">
              Secure • Encrypted • Protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycVerification;