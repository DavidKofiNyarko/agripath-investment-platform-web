"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // CardHeader, CardTitle unused
// import { Input } from '@/components/ui/input'; // Unused import
// import { Label } from '@/components/ui/label'; // Unused import
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
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
  Shield,
} from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { useProfile } from "@/contexts/ProfileContext";
import { useUser } from "@/contexts/UserContext";

interface KycVerificationProps {
  onComplete?: () => void;
  onSkip?: () => void;
  isEditMode?: boolean;
}

const KycVerification: React.FC<KycVerificationProps> = ({
  onComplete,
  onSkip,
  isEditMode = false,
}) => {
  const { profile, refreshProfile } = useProfile();
  const { user } = useUser();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Document states
  const [idFront, setIdFront] = useState<string | null>(
    profile?.kyc_documents?.id_front || null
  );
  const [idBack, setIdBack] = useState<string | null>(
    profile?.kyc_documents?.id_back || null
  );
  const [selfie, setSelfie] = useState<string | null>(
    profile?.kyc_documents?.selfie || null
  );

  // File input refs
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      id: 1,
      title: "National ID Front",
      icon: FileText,
      description: "Upload front of your National ID",
    },
    {
      id: 2,
      title: "National ID Back",
      icon: FileText,
      description: "Upload back of your National ID",
    },
    {
      id: 3,
      title: "Selfie Photo",
      icon: User,
      description: "Take a clear selfie photo",
    },
    {
      id: 4,
      title: "Review & Submit",
      icon: Check,
      description: "Review documents and submit",
    },
  ];

  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG and PNG files are allowed");
      return false;
    }

    return true;
  };

  const uploadFile = async (
    file: File,
    path: string
  ): Promise<string | null> => {
    try {
      const { data, error: _error } = await supabase.storage
        .from("project-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        setError(`Failed to upload file: ${error}`);
        return null;
      }

      if (!data) {
        setError("Upload failed: No data returned");
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("project-images").getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload file");
      return null;
    }
  };

  const handleFileUpload = async (
    file: File,
    type: "id_front" | "id_back" | "selfie"
  ) => {
    if (!validateFile(file)) return;

    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const fileName = `${profile?.id}/${type}_${Date.now()}.${file.name
        .split(".")
        .pop()}`;
      const url = await uploadFile(file, fileName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (url) {
        if (type === "id_front") setIdFront(url);
        else if (type === "id_back") setIdBack(url);
        else if (type === "selfie") setSelfie(url);

        setSuccess(`${type.replace("_", " ")} uploaded successfully!`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent,
    type: "id_front" | "id_back" | "selfie"
  ) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const removeDocument = (type: "id_front" | "id_back" | "selfie") => {
    if (type === "id_front") setIdFront(null);
    else if (type === "id_back") setIdBack(null);
    else if (type === "selfie") setSelfie(null);
  };

  const handleSubmitKyc = async () => {
    if (!idFront || !idBack || !selfie) {
      setError("Please upload all required documents");
      return;
    }

    if (!user?.id) {
      setError("User not authenticated. Please refresh and try again.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const { error: _error } = await supabase
        .from("profile")
        .update({
          kyc_status: "pending",
          kyc_documents: {
            id_front: idFront,
            id_back: idBack,
            selfie: selfie,
          },
        })
        .eq("user_id", user.id);

      if (_error) {
        console.error("KYC submission error:", _error);
        setError(
          isEditMode
            ? "Failed to update KYC documents. Please try again."
            : "Failed to submit KYC. Please try again."
        );
        return;
      }

      setSuccess(
        isEditMode
          ? "KYC documents updated successfully! We will review your updated documents."
          : "KYC submitted successfully! We will review your documents."
      );
      await refreshProfile();

      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    } catch (error) {
      console.error("KYC submission error:", error);
      setError(
        isEditMode
          ? "Failed to update KYC documents. Please try again."
          : "Failed to submit KYC. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => {
    // Check if current step is completed before allowing next
    if (currentStep === 1 && !idFront) {
      setError("Please upload your National ID front before proceeding.");
      return;
    }
    if (currentStep === 2 && !idBack) {
      setError("Please upload your National ID back before proceeding.");
      return;
    }
    if (currentStep === 3 && !selfie) {
      setError("Please take a selfie photo before proceeding.");
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError(""); // Clear any previous errors
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload National ID Front
              </h3>
              <p className="text-gray-600">
                Please upload a clear photo of the front of your National ID
                card
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                    How to take a good ID photo:
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Place your ID on a flat, well-lit surface</li>
                    <li>Ensure all corners are visible and text is readable</li>
                    <li>Use good lighting - avoid shadows and glare</li>
                    <li>Take the photo from directly above the ID</li>
                    <li>Make sure the entire ID fits in the frame</li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "id_front")}
            >
              {idFront ? (
                <div className="space-y-4">
                  <div className="w-full max-w-md mx-auto">
                    <img
                      src={idFront}
                      alt="National ID Front"
                      className="w-full h-auto rounded-lg border-2 border-green-200 shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="hidden w-32 h-32 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <p className="text-green-600 font-medium">
                    National ID Front uploaded successfully!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => removeDocument("id_front")}
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
                    <p className="text-gray-600 mb-2">
                      Drag and drop your National ID front here, or
                    </p>
                    <button
                      type="button"
                      onClick={() => idFrontRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg rounded-md px-4 py-2"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supports: JPG, PNG (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            <input
              id="id-front-input"
              ref={idFrontRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], "id_front");
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload National ID Back
              </h3>
              <p className="text-gray-600">
                Please upload a clear photo of the back of your National ID card
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                    How to take a good ID photo:
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Place your ID on a flat, well-lit surface</li>
                    <li>Ensure all corners are visible and text is readable</li>
                    <li>Use good lighting - avoid shadows and glare</li>
                    <li>Take the photo from directly above the ID</li>
                    <li>Make sure the entire ID fits in the frame</li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "id_back")}
            >
              {idBack ? (
                <div className="space-y-4">
                  <div className="w-full max-w-md mx-auto">
                    <img
                      src={idBack}
                      alt="National ID Back"
                      className="w-full h-auto rounded-lg border-2 border-green-200 shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="hidden w-32 h-32 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <p className="text-green-600 font-medium">
                    National ID Back uploaded successfully!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => removeDocument("id_back")}
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
                    <p className="text-gray-600 mb-2">
                      Drag and drop your National ID back here, or
                    </p>
                    <button
                      type="button"
                      onClick={() => idBackRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg rounded-md px-4 py-2"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supports: JPG, PNG (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            <input
              id="id-back-input"
              ref={idBackRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], "id_back");
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Take Selfie Photo
              </h3>
              <p className="text-gray-600">
                Please take a clear selfie photo for identity verification
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                    How to take a good selfie:
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Use good lighting - face a window or bright light</li>
                    <li>Look directly at the camera with a neutral expression</li>
                    <li>Remove glasses, hat, or anything covering your face</li>
                    <li>Ensure your full face is visible and in focus</li>
                    <li>Use a plain background if possible</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  disabled={uploading}
                  className="h-20 w-full bg-green-600 hover:bg-green-700 text-white font-semibold flex flex-col items-center justify-center shadow-lg rounded-md"
                >
                  <Camera className="w-6 h-6 mb-2" />
                  Take Photo
                </button>

                <button
                  type="button"
                  onClick={() => selfieRef.current?.click()}
                  disabled={uploading}
                  className="h-20 w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold flex flex-col items-center justify-center rounded-md"
                >
                  <Upload className="w-6 h-6 mb-2" />
                  Upload Photo
                </button>
              </div>

              {/* Drag and Drop Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "selfie")}
              >
                {selfie ? (
                  <div className="space-y-4">
                    <div className="w-full max-w-md mx-auto">
                      <img
                        src={selfie}
                        alt="Selfie"
                        className="w-full h-auto max-h-64 mx-auto rounded-lg border-2 border-green-200 shadow-md object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden w-32 h-32 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <p className="text-green-600 font-medium">
                      Selfie uploaded successfully!
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => removeDocument("selfie")}
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
                      <p className="text-gray-600 mb-2">
                        Drag and drop your selfie photo here, or
                      </p>
                      <p className="text-sm text-gray-500">
                        Use the buttons above to take or upload a photo
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Supports: JPG, PNG (Max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <input
              id="upload-selfie-input"
              ref={selfieRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], "selfie");
                }
              }}
            />

            <input
              id="take-selfie-input"
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], "selfie");
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Review Documents
              </h3>
              <p className="text-gray-600">
                Please review your uploaded documents before submitting
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  {idFront ? (
                    <div className="space-y-2">
                      <div className="w-full max-w-xs mx-auto">
                        <img
                          src={idFront}
                          alt="National ID Front"
                          className="w-full h-auto rounded-lg border-2 border-green-200 shadow-sm mb-2"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden w-16 h-16 mx-auto rounded-lg bg-green-100 flex items-center justify-center">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-600">Uploaded</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                        <X className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium">National ID Front</p>
                      <p className="text-sm text-gray-500">Not uploaded</p>
                    </>
                  )}
                </div>

                <div className="text-center p-4 border rounded-lg">
                  {idBack ? (
                    <div className="space-y-2">
                      <div className="w-full max-w-xs mx-auto">
                        <img
                          src={idBack}
                          alt="National ID Back"
                          className="w-full h-auto rounded-lg border-2 border-green-200 shadow-sm mb-2"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden w-16 h-16 mx-auto rounded-lg bg-green-100 flex items-center justify-center">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-600">Uploaded</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                        <X className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium">National ID Back</p>
                      <p className="text-sm text-gray-500">Not uploaded</p>
                    </>
                  )}
                </div>

                <div className="text-center p-4 border rounded-lg">
                  {selfie ? (
                    <div className="space-y-2">
                      <div className="w-full max-w-xs mx-auto">
                        <img
                          src={selfie}
                          alt="Selfie"
                          className="w-full h-auto max-h-32 mx-auto rounded-lg border-2 border-green-200 shadow-sm mb-2 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden w-16 h-16 mx-auto rounded-lg bg-green-100 flex items-center justify-center">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-600">Uploaded</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                        <X className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium">Selfie Photo</p>
                      <p className="text-sm text-gray-500">Not uploaded</p>
                    </>
                  )}
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
    <div className="w-full max-w-4xl mx-auto">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">
              {isEditMode ? "Edit KYC Documents" : "KYC Verification"}
            </h1>
            <p className="text-green-100 text-sm">
              {isEditMode
                ? "Update your documents"
                : `Step ${currentStep} of 4`}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditMode ? "Edit KYC Documents" : "Identity Verification"}
            </h1>
            <p className="text-green-100">
              {isEditMode
                ? "Update your documents for review"
                : "Complete your KYC verification to unlock full access"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-b-lg">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, _index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-xs mt-2 text-center hidden sm:block max-w-16">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(currentStep / 4) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="mb-6">
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
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">Uploading...</span>
                  <span className="text-blue-600 font-medium">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
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
                <p className="text-red-800 text-sm font-medium">{error}</p>
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
                <p className="text-green-800 text-sm font-medium">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3"
                disabled={uploading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 shadow-lg"
                disabled={
                  uploading ||
                  (currentStep === 1 && !idFront) ||
                  (currentStep === 2 && !idBack) ||
                  (currentStep === 3 && !selfie)
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitKyc}
                disabled={uploading || !idFront || !idBack || !selfie}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 shadow-lg"
              >
                {uploading
                  ? isEditMode
                    ? "Updating..."
                    : "Submitting..."
                  : isEditMode
                  ? "Update Documents"
                  : "Submit KYC"}
              </Button>
            )}
          </div>

          {/* Skip Button */}
          {onSkip && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 font-medium"
                disabled={uploading}
              >
                Skip for now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KycVerification;
