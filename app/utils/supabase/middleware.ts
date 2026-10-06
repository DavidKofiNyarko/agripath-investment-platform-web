import { type NextRequest, NextResponse } from "next/server";

/**
 * Supabase middleware client factory.
 *
 * Creates an unmodified response. Supabase auth middleware can be layered on
 * top by callers that need to refresh sessions on the edge.
 */
export const createClient = (request: NextRequest) => {
  const supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  return supabaseResponse;
};
