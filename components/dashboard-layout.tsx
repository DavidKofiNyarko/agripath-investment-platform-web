'use client';

import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion'; // motion unused
import { Sidebar, MobileSidebar, SidebarProvider, useSidebar } from './sidebar';
import ProfileGuard from './profile-guard';
import { cn } from '@/lib/utils';
// Legacy profile completion modal removed in favor of in-page overlay

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const DashboardContent = ({ children, className }: DashboardLayoutProps) => {
  const { isCollapsed } = useSidebar();
  // Profile setup is now handled by page-level overlay (e.g., Dashboard page)

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        "lg:ml-64", // Default margin for expanded sidebar
        isCollapsed && "lg:ml-20" // Smaller margin for collapsed sidebar
      )}>
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 lg:hidden bg-white border-b border-gray-200">
          <div className="flex items-center gap-x-4 px-4 py-3">
            <MobileSidebar />
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-gray-900 tracking-wide">AGRIPATH</div>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <main className={cn('py-6 min-h-screen', className)}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ProfileGuard>
              {children}
            </ProfileGuard>
          </div>
        </main>
      </div>

      {/* Profile completion modal removed */}
    </div>
  );
};

export const DashboardLayout = ({ children, className }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <DashboardContent className={className}>
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;
