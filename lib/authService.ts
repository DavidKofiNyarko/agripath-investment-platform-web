import { createClient } from '@/app/utils/supabase/client';

export interface LogoutResult {
  success: boolean;
  error?: string;
}

/**
 * Logs out the current user from all devices
 * Uses Supabase's global scope to invalidate all sessions
 */
export const logoutAllDevices = async (): Promise<LogoutResult> => {
  const supabase = createClient();
  
  try {
    // Log out from ALL devices (global scope)
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('Supabase logout error:', error);
      return { success: false, error: error.message };
    }
    
    // Clear any local state if needed
    localStorage.removeItem('agripath-user-preferences');
    
    // Redirect to signin page
    window.location.href = '/signin';
    
    return { success: true };
  } catch (error) {
    console.error('Error logging out all devices:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Logs out the current user from other devices only
 * Keeps the current session active
 */
export const logoutOtherDevices = async (): Promise<LogoutResult> => {
  const supabase = createClient();
  
  try {
    // Log out from other devices only (others scope)
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    
    if (error) {
      console.error('Supabase logout error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error logging out other devices:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Logs out the current user from current device only
 * Keeps sessions on other devices active
 */
export const logoutCurrentDevice = async (): Promise<LogoutResult> => {
  const supabase = createClient();
  
  try {
    // Log out from current device only (local scope)
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    
    if (error) {
      console.error('Supabase logout error:', error);
      return { success: false, error: error.message };
    }
    
    // Redirect to signin page
    window.location.href = '/signin';
    
    return { success: true };
  } catch (error) {
    console.error('Error logging out current device:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
