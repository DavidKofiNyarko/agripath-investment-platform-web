'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import {
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Briefcase,
  Bell,
  HelpCircle,
  FileText,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    section: 'main'
  },
  {
    title: 'Investments',
    icon: PiggyBank,
    href: '/investments',
    section: 'main'
  },
  {
    title: 'Transactions',
    icon: Receipt,
    href: '/transactions',
    section: 'main'
  },
  {
    title: 'My Portfolio',
    icon: Briefcase,
    href: '/portfolio',
    section: 'main'
  },
  {
    title: 'Updates',
    icon: Bell,
    href: '/updates',
    section: 'main'
  }
];

const secondaryItems = [
  {
    title: 'Support',
    icon: HelpCircle,
    href: '/support',
    section: 'secondary'
  },
  {
    title: 'Legal',
    icon: FileText,
    href: '/legal',
    section: 'secondary'
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/settings',
    section: 'secondary'
  }
];

interface SidebarProps {
  className?: string;
}

const SidebarContent = ({ className }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { signOut } = useUser();
  const { profile } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={cn('flex h-full flex-col bg-white border-r shadow-sm', className)}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <div className="relative w-10 h-10 flex-shrink-0">
              {/* Farm house icon */}
              <Image src="/s-logo.png" alt="Farm House" width={300} height={300} />
            </div>
          ) : (
            <div className="transition-opacity duration-200">
              <Image src="/logo.png" alt="Farm House" width={300} height={300} />
            </div>
          )}
        </div>
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex h-8 w-8 p-0 hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 py-4 overflow-y-auto">
        {/* Main Menu */}
        <div className="mb-8">
          {!isCollapsed && (
            <h2 className="text-sm font-medium text-gray-500 mb-3 px-2">Menu</h2>
          )}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const showKycBadge = item.title === 'Settings' && profile?.kyc_status !== 'verified';
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-none transition-colors duration-150 relative',
                    isCollapsed ? 'justify-center' : 'justify-start',
                    isActive
                      ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-green-600' : 'text-gray-500'
                  )} />
                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                  {showKycBadge && !isCollapsed && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {showKycBadge && isCollapsed && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Menu */}
        <div className="mb-8">
          {!isCollapsed && (
            <h2 className="text-sm font-medium text-gray-500 mb-3 px-2">Secondary</h2>
          )}
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-none transition-colors duration-150',
                    isCollapsed ? 'justify-center' : 'justify-start',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-green-600' : 'text-gray-500'
                  )} />
                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-auto">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 flex-shrink-0" />
            )}
            {!isCollapsed && (
              <span className="truncate">{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Sidebar = ({ className }: SidebarProps) => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div 
      className={cn(
        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50 transition-all duration-300 ease-in-out',
        isCollapsed ? 'lg:w-20' : 'lg:w-64',
        className
      )}
    >
      <SidebarContent />
    </div>
  );
};

export const MobileSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-10 w-10 p-0"
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <SidebarContext.Provider value={{ isCollapsed: false, setIsCollapsed: () => {} }}>
          <SidebarContent />
        </SidebarContext.Provider>
      </SheetContent>
    </Sheet>
  );
};

// Provider component to wrap the app
export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default Sidebar;
