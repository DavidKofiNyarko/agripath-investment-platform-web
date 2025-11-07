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
 * Uses dev.infra.agripath.co for localhost, infra.agripath.co for production
 */
export function getApiBaseDomain(): string {
  // Check if we're in the browser
  if (typeof window !== "undefined") {
    // Check if running on localhost or development environment
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1")
    ) {
      return "https://dev.infra.agripath.co";
    }

    // For production (app.agripath.co), use production API
    if (
      window.location.hostname === "app.agripath.co" ||
      window.location.hostname.includes("agripath.co")
    ) {
      return "https://infra.agripath.co";
    }
  }

  // Check environment variable for explicit override
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // Default to production for deployed environments
  return "https://infra.agripath.co";
}
