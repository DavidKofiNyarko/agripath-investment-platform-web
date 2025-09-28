'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Shield, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/app/utils/supabase/client';

const PinChange: React.FC = () => {
  const { profile, refreshProfile } = useProfile();
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createClient();
  const currentPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string, pinType: 'current' | 'new' | 'confirm') => {
    if (value.length > 1) return;
    
    if (pinType === 'current') {
      const newPin = [...currentPin];
      newPin[index] = value;
      setCurrentPin(newPin);
      
      // Auto-focus next input
      if (value && index < 3) {
        currentPinRefs.current[index + 1]?.focus();
      }
    } else if (pinType === 'new') {
      const newPinArray = [...newPin];
      newPinArray[index] = value;
      setNewPin(newPinArray);
      
      // Auto-focus next input
      if (value && index < 3) {
        newPinRefs.current[index + 1]?.focus();
      }
    } else {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);
      
      // Auto-focus next input
      if (value && index < 3) {
        confirmPinRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, pinType: 'current' | 'new' | 'confirm') => {
    if (e.key === 'Backspace') {
      const currentValue = pinType === 'current' ? currentPin : pinType === 'new' ? newPin : confirmPin;
      const refs = pinType === 'current' ? currentPinRefs : pinType === 'new' ? newPinRefs : confirmPinRefs;
      
      if (!currentValue[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const validatePins = () => {
    const currentPinValue = currentPin.join('');
    const newPinValue = newPin.join('');
    const confirmPinValue = confirmPin.join('');

    if (currentPinValue.length !== 4) {
      setError('Please enter your current 4-digit PIN');
      return false;
    }

    if (newPinValue.length !== 4) {
      setError('Please enter a new 4-digit PIN');
      return false;
    }

    if (confirmPinValue.length !== 4) {
      setError('Please confirm your new 4-digit PIN');
      return false;
    }

    if (currentPinValue === newPinValue) {
      setError('New PIN must be different from current PIN');
      return false;
    }

    if (newPinValue !== confirmPinValue) {
      setError('New PINs do not match. Please try again.');
      return false;
    }

    // Check if current PIN is correct
    if (profile?.pin !== currentPinValue) {
      setError('Current PIN is incorrect');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePins()) return;

    setIsLoading(true);

    try {
      const newPinValue = newPin.join('');
      
      const { error } = await supabase
        .from('profiles')
        .update({ pin: newPinValue })
        .eq('id', profile?.id);

      if (error) {
        setError('Failed to update PIN. Please try again.');
        return;
      }

      setSuccess('PIN updated successfully!');
      setCurrentPin(['', '', '', '']);
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      
      // Refresh profile context
      await refreshProfile();
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const currentPinValue = currentPin.join('');
    const newPinValue = newPin.join('');
    const confirmPinValue = confirmPin.join('');
    
    return currentPinValue.length === 4 && 
           newPinValue.length === 4 && 
           confirmPinValue.length === 4 && 
           newPinValue === confirmPinValue &&
           currentPinValue !== newPinValue;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Change Transaction PIN
        </CardTitle>
        <CardDescription>
          Update your 4-digit PIN for secure transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current PIN */}
          <div>
            <Label className="text-center block text-sm font-medium text-gray-700 mb-4">
              Enter your current 4-digit PIN
            </Label>
            <div className="flex justify-center space-x-3">
              {currentPin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { currentPinRefs.current[index] = el; }}
                  type={showCurrentPin ? 'text' : 'password'}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, 'current')}
                  onKeyDown={(e) => handleKeyDown(index, e, 'current')}
                  className="w-12 h-12 text-center text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500"
                  maxLength={1}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* New PIN */}
          <div>
            <Label className="text-center block text-sm font-medium text-gray-700 mb-4">
              Enter your new 4-digit PIN
            </Label>
            <div className="flex justify-center space-x-3">
              {newPin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { newPinRefs.current[index] = el; }}
                  type={showNewPin ? 'text' : 'password'}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, 'new')}
                  onKeyDown={(e) => handleKeyDown(index, e, 'new')}
                  className="w-12 h-12 text-center text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500"
                  maxLength={1}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Confirm PIN */}
          <div>
            <Label className="text-center block text-sm font-medium text-gray-700 mb-4">
              Confirm your new 4-digit PIN
            </Label>
            <div className="flex justify-center space-x-3">
              {confirmPin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { confirmPinRefs.current[index] = el; }}
                  type={showConfirmPin ? 'text' : 'password'}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, 'confirm')}
                  onKeyDown={(e) => handleKeyDown(index, e, 'confirm')}
                  className="w-12 h-12 text-center text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500"
                  maxLength={1}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Show/Hide PIN Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCurrentPin(!showCurrentPin)}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              {showCurrentPin ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Current
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Current
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewPin(!showNewPin)}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              {showNewPin ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide New
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show New
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmPin(!showConfirmPin)}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              {showConfirmPin ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Confirm
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Confirm
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
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
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating PIN...
              </>
            ) : (
              'Update PIN'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PinChange;
