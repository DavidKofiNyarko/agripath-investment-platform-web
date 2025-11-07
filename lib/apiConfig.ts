/**
 * Get the API base URL based on environment
 * Uses dev.infra.agripath for localhost, infra.agripath.co for production
 */
export function getApiBaseUrl(): string {
  // Check if we're in the browser
  if (typeof window !== "undefined") {
    // Check if running on localhost
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("localhost")
    ) {
      return "https://dev.infra.agripath.co/api/payments";
    }
  }

  // Check environment variable first
  if (process.env.NEXT_PUBLIC_PAYMENT_API_URL) {
    return process.env.NEXT_PUBLIC_PAYMENT_API_URL;
  }

  // Default to production
  return "https://infra.agripath.co/api/payments";
}

/**
 * Get the base API URL (without /api/payments)
 * Always uses dev.infra.agripath.co for localhost and testing
 */
export function getApiBaseDomain(): string {
  // Check if we're in the browser
  if (typeof window !== "undefined") {
    // Check if running on localhost or any development environment
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1") ||
      process.env.NODE_ENV === "development"
    ) {
      return "https://dev.infra.agripath.co";
    }
  }

  // Check environment variable for explicit override
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // For now, default to dev for testing (change to production when ready)
  // Default to production
  return "https://dev.infra.agripath.co";
}
