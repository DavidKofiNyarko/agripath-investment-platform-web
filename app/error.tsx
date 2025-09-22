'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Home, RefreshCw, Bug, Zap } from 'lucide-react';

const ErrorPage = () => {
  const router = useRouter();

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
        repeat: 2
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const floatVariants = {
    float: {
      y: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const rotateVariants = {
    rotate: {
      rotate: 360,
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "linear"
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
          variants={floatVariants}
          animate="float"
        >
          <AlertTriangle className="w-16 h-16" />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-20 text-orange-200"
          variants={floatVariants}
          animate="float"
          style={{ animationDelay: '1s' }}
        >
          <Bug className="w-12 h-12" />
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-20 text-yellow-200"
          variants={floatVariants}
          animate="float"
          style={{ animationDelay: '2s' }}
        >
          <Zap className="w-14 h-14" />
        </motion.div>

        <motion.div
          className="absolute top-60 right-10 text-red-100"
          variants={floatVariants}
          animate="float"
          style={{ animationDelay: '0.5s' }}
        >
          <AlertTriangle className="w-10 h-10" />
        </motion.div>

        {/* Rotating Elements */}
        <motion.div
          className="absolute top-32 right-32 text-orange-300"
          variants={rotateVariants}
          animate="rotate"
        >
          <Bug className="w-8 h-8" />
        </motion.div>

        <motion.div
          className="absolute bottom-40 right-40 text-yellow-200"
          variants={rotateVariants}
          animate="rotate"
          style={{ animationDelay: '2s' }}
        >
          <Zap className="w-6 h-6" />
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
            
            {/* Animated Rings */}
            <motion.div
              className="absolute inset-0 border-4 border-red-300 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-orange-300 rounded-full"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.05, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-gray-800 mb-4"
            variants={itemVariants}
          >
            Oops! Something Went Wrong
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl text-gray-600 mb-8"
            variants={itemVariants}
          >
            It looks like our farm equipment hit a snag! Don't worry, our team is already working to fix it. 🚜
          </motion.p>

          {/* Error Details */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-red-100"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bug className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-700">Error Details</span>
            </div>
            <p className="text-gray-600 text-sm">
              Something unexpected happened while processing your request. This might be a temporary issue.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => router.push('/dashboard')}
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
              Try Again
            </motion.button>
          </motion.div>

          {/* Help Message */}
          <motion.div
            className="mt-12 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-yellow-200"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-700">Need Help?</span>
            </div>
            <p className="text-gray-700">
              If this problem persists, please contact our support team. 
              <span className="text-green-600 font-semibold"> We're here to help you get back to farming!</span>
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-200/50 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      />
    </div>
  );
};

export default ErrorPage;
