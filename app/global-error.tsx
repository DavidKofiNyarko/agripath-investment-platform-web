'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const GlobalErrorPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const shakeVariants = {
    shake: {
      x: [-10, 10, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.5,
        repeat: 3
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Error Icons */}
        <motion.div
          className="absolute top-20 left-10 text-red-200"
          animate={{
            y: [-5, 5, -5],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <AlertTriangle className="w-16 h-16" />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-20 text-orange-200"
          animate={{
            y: [5, -5, 5],
            rotate: [0, -5, 5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <AlertTriangle className="w-12 h-12" />
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-20 text-yellow-200"
          animate={{
            y: [-3, 3, -3],
            rotate: [0, 3, -3, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          <AlertTriangle className="w-14 h-14" />
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex items-center justify-center min-h-screen px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center max-w-2xl mx-auto">
          {/* Error Icon */}
          <motion.div
            className="relative mb-8"
            variants={itemVariants}
          >
            <motion.div
              className="inline-block"
              variants={shakeVariants}
              animate="shake"
            >
              <motion.div
                className="w-32 h-32 mx-auto bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
                variants={pulseVariants}
                animate="pulse"
              >
                <AlertTriangle className="w-16 h-16 text-white" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-gray-800 mb-4"
            variants={itemVariants}
          >
            Critical Error
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl text-gray-600 mb-8"
            variants={itemVariants}
          >
            Something went seriously wrong with our application. Our team has been notified and is working on a fix.
          </motion.p>

          {/* Error Details */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-red-100"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-700">Global Error</span>
            </div>
            <p className="text-gray-600 text-sm">
              This is a critical application error that requires immediate attention. Please try refreshing the page or contact support if the issue persists.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => window.location.href = '/'}
              className="group flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full font-semibold text-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              Go Home
            </motion.button>

            <motion.button
              onClick={() => window.location.reload()}
              className="group flex items-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-full font-semibold text-lg hover:bg-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Refresh Page
            </motion.button>
          </motion.div>

          {/* Help Message */}
          <motion.div
            className="mt-12 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-yellow-200"
            variants={itemVariants}
          >
            <p className="text-gray-700">
              <span className="font-semibold text-red-600">Important:</span> This is a critical error. 
              If refreshing doesn't work, please contact our technical support team immediately.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalErrorPage;
