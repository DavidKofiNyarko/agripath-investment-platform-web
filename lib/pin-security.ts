import bcrypt from 'bcryptjs';

/**
 * Hash a PIN for secure storage
 * @param pin - The PIN to hash (4-digit string)
 * @returns Promise<string> - The hashed PIN
 */
export async function hashPin(pin: string): Promise<string> {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be a 4-digit number');
  }
  
  const saltRounds = 12;
  return await bcrypt.hash(pin, saltRounds);
}

/**
 * Verify a PIN against its hash
 * @param pin - The PIN to verify (4-digit string)
 * @param hashedPin - The stored hash
 * @returns Promise<boolean> - True if PIN matches
 */
export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return false;
  }
  
  if (!hashedPin) {
    return false;
  }
  
  return await bcrypt.compare(pin, hashedPin);
}

/**
 * Generate a random 4-digit PIN for reset purposes
 * @returns string - A random 4-digit PIN
 */
export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a secure reset token
 * @returns string - A secure random token
 */
export function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Check if a PIN is valid format
 * @param pin - The PIN to validate
 * @returns boolean - True if PIN format is valid
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
