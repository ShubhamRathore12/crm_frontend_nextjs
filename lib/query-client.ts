import { QueryClient } from "@tanstack/react-query";

// Global query retry function with exponential backoff
function retry(failureCount: number, error: any): boolean {
  // Don't retry on 4xx errors (client errors)
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }
  
  // Retry up to 3 times for server errors
  return failureCount < 3;
}

// Create a singleton query client with optimized defaults
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache time (formerly gcTime): 10 minutes
        gcTime: 10 * 60 * 1000,
        // Stale time: 2 minutes (data considered fresh for 2 minutes)
        staleTime: 2 * 60 * 1000,
        // Refetch on window focus (good for real-time dashboards)
        refetchOnWindowFocus: true,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Retry with exponential backoff
        retry,
        // Don't retry immediately
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Network mode (avoid suspense waterfalls)
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        // Network mode for mutations
        networkMode: 'online',
      },
    },
  });
}

// Export a singleton instance
export const queryClient = createQueryClient();

// Helper to prefetch data
export async function prefetchQuery<T>(
  key: any[],
  fetcher: () => Promise<T>,
  options?: { staleTime?: number }
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: options?.staleTime,
  });
}

// Helper to invalidate queries
export function invalidateQueries(key: any[]): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: key });
}

// Helper to set query data (optimistic updates)
export function setQueryData<T>(key: any[], data: T): void {
  queryClient.setQueryData(key, data);
}