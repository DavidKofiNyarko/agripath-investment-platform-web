'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  cancelText?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  onConfirm,
  showCancel = false,
  cancelText = 'Cancel'
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          title: 'text-green-900',
          message: 'text-green-800',
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'error':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          title: 'text-red-900',
          message: 'text-red-800',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          border: 'border-amber-200',
          bg: 'bg-amber-50',
          title: 'text-amber-900',
          message: 'text-amber-800',
          confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'info':
      default:
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          title: 'text-blue-900',
          message: 'text-blue-800',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Alert Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className={`relative w-full max-w-md mx-auto ${colors.bg} ${colors.border} border rounded-xl shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    {getIcon()}
                  </div>
                  <div className="flex-1">
                    {title && (
                      <h3 className={`text-lg font-semibold ${colors.title} mb-2`}>
                        {title}
                      </h3>
                    )}
                    <p className={`text-sm ${colors.message} leading-relaxed`}>
                      {message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  {showCancel && (
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="px-6"
                    >
                      {cancelText}
                    </Button>
                  )}
                  <Button
                    onClick={handleConfirm}
                    className={`px-6 ${colors.confirmButton}`}
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert;
