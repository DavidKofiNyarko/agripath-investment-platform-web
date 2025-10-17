'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface PinResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PinResetModal: React.FC<PinResetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const pinRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string, type: 'pin' | 'confirm' = 'pin') => {
    if (value.length > 1) return;
    
    if (type === 'pin') {
      const newPinArray = [...newPin];
      newPinArray[index] = value;
      setNewPin(newPinArray);
      
      if (value && index < 3) {
        pinRefs.current[index + 1]?.focus();
      }
    } else {
      const newConfirmPinArray = [...confirmPin];
      newConfirmPinArray[index] = value;
      setConfirmPin(newConfirmPinArray);
      
      if (value && index < 3) {
        confirmPinRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, type: 'pin' | 'confirm' = 'pin') => {
    if (e.key === 'Backspace' && !(type === 'pin' ? newPin[index] : confirmPin[index]) && index > 0) {
      (type === 'pin' ? pinRefs.current[index - 1] : confirmPinRefs.current[index - 1])?.focus();
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pin-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('verify');
        // In a real implementation, you'd extract the token from the email
        // For now, we'll simulate it
        setResetToken('simulated-token');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const pinString = newPin.join('');
    const confirmPinString = confirmPin.join('');

    if (pinString !== confirmPinString) {
      setError('PINs do not match');
      return;
    }

    if (pinString.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pin-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: resetToken, 
          newPin: pinString 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        setError(data.error || 'Failed to reset PIN');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setError('');
    setResetToken('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="relative">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                {step === 'email' && <Mail className="h-8 w-8 text-green-600" />}
                {step === 'verify' && <Lock className="h-8 w-8 text-green-600" />}
                {step === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {step === 'email' && 'Reset Your PIN'}
                {step === 'verify' && 'Set New PIN'}
                {step === 'success' && 'PIN Reset Successfully'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {step === 'email' && 'Enter your email address to receive a reset code'}
                {step === 'verify' && 'Enter your new 4-digit PIN'}
                {step === 'success' && 'Your PIN has been updated successfully'}
              </p>
            </CardHeader>
            
            <CardContent>
              {step === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !email}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Code'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {step === 'verify' && (
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <Label>New PIN</Label>
                    <div className="flex gap-2 justify-center mt-2">
                      {newPin.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => (pinRefs.current[index] = el)}
                          type={showPin ? 'text' : 'password'}
                          value={digit}
                          onChange={(e) => handlePinChange(index, e.target.value, 'pin')}
                          onKeyDown={(e) => handleKeyDown(index, e, 'pin')}
                          className="w-12 h-12 text-center text-lg font-mono"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPin(!showPin)}
                      className="mt-2"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPin ? 'Hide' : 'Show'}
                    </Button>
                  </div>

                  <div>
                    <Label>Confirm PIN</Label>
                    <div className="flex gap-2 justify-center mt-2">
                      {confirmPin.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => (confirmPinRefs.current[index] = el)}
                          type={showConfirmPin ? 'text' : 'password'}
                          value={digit}
                          onChange={(e) => handlePinChange(index, e.target.value, 'confirm')}
                          onKeyDown={(e) => handleKeyDown(index, e, 'confirm')}
                          className="w-12 h-12 text-center text-lg font-mono"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="mt-2"
                    >
                      {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showConfirmPin ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('email')}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || newPin.some(d => !d) || confirmPin.some(d => !d)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Resetting...
                        </>
                      ) : (
                        'Reset PIN'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="text-center space-y-4">
                  <div className="text-green-600">
                    <CheckCircle className="h-16 w-16 mx-auto" />
                  </div>
                  <p className="text-gray-600">
                    Your PIN has been successfully reset. You can now use your new PIN to access your account.
                  </p>
                  <Button
                    onClick={() => {
                      onSuccess();
                      handleClose();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinResetModal;
