import { performanceMonitor } from "@/lib/performance";

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;
  private requestCache: Map<string, { timestamp: number; promise: Promise<any> }>;
  private cacheTTL: number;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.requestCache = new Map();
    this.cacheTTL = 1000; // 1 second cache for duplicate requests
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: any;
      params?: Record<string, string>;
      headers?: Record<string, string>;
      cacheKey?: string;
    }
  ): Promise<T> {
    const startTime = performance.now();
    const cacheKey = options?.cacheKey || `${method}:${path}:${JSON.stringify(options?.params || {})}`;

    // Check for duplicate in-flight requests
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.promise;
    }

    const url = new URL(`${this.baseURL}/api/v1${path}`);
    
    // Add query parameters
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value);
        }
      });
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...this.headers,
        ...options?.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    // Add body for non-GET requests
    if (options?.body && method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body);
    }

    // Create the promise
    const promise = (async () => {
      try {
        const response = await fetch(url.toString(), requestOptions);
        const duration = performance.now() - startTime;

        // Track API performance
        performanceMonitor.trackApiRequest(
          path,
          duration,
          response.status,
          method
        );

        // Handle non-OK responses
        if (!response.ok) {
          let errorData: any;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText };
          }

          const error: ApiError = {
            status: response.status,
            message: errorData.error || errorData.message || response.statusText,
            errors: errorData.errors,
          };

          throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return {} as T;
        }

        return response.json() as Promise<T>;
      } catch (error) {
        // Remove from cache on error
        this.requestCache.delete(cacheKey);
        throw error;
      } finally {
        // Clean up cache after TTL
        setTimeout(() => {
          this.requestCache.delete(cacheKey);
        }, this.cacheTTL);
      }
    })();

    // Cache the promise
    this.requestCache.set(cacheKey, {
      timestamp: Date.now(),
      promise,
    });

    return promise;
  }

  // HTTP methods
  get<T>(path: string, params?: Record<string, string>, headers?: Record<string, string>) {
    return this.request<T>('GET', path, { params, headers });
  }

  post<T>(path: string, body?: any, params?: Record<string, string>, headers?: Record<string, string>) {
    return this.request<T>('POST', path, { body, params, headers });
  }

  put<T>(path: string, body?: any, params?: Record<string, string>, headers?: Record<string, string>) {
    return this.request<T>('PUT', path, { body, params, headers });
  }

  patch<T>(path: string, body?: any, params?: Record<string, string>, headers?: Record<string, string>) {
    return this.request<T>('PATCH', path, { body, params, headers });
  }

  delete<T>(path: string, params?: Record<string, string>, headers?: Record<string, string>) {
    return this.request<T>('DELETE', path, { params, headers });
  }

  // Clear request cache
  clearCache(): void {
    this.requestCache.clear();
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.headers.Authorization = `Bearer ${token}`;
  }

  // Remove authentication token
  clearAuthToken(): void {
    delete this.headers.Authorization;
  }
}

// Create singleton instance
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'https://primeosys.com/crm-backend',
  timeout: 30000,
});

// Helper for getting auth headers
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Hook for using API client in components
export function useApi() {
  return apiClient;
}