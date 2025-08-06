import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Error types for smart retry logic
enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  AUTH = 'auth',
  RATE_LIMIT = 'rate_limit',
}

interface ErrorContext {
  type: ErrorType;
  retryable: boolean;
  delay: number;
  userMessage: string;
}

class RetryError extends Error {
  context: ErrorContext;
  
  constructor(message: string, context: ErrorContext) {
    super(message);
    this.context = context;
    this.name = 'RetryError';
  }
}

// Network status tracking
class NetworkStatusTracker {
  private isOnline = navigator.onLine;
  private listeners: ((online: boolean) => void)[] = [];

  constructor() {
    window.addEventListener('online', () => this.setOnlineStatus(true));
    window.addEventListener('offline', () => this.setOnlineStatus(false));
  }

  private setOnlineStatus(online: boolean) {
    this.isOnline = online;
    this.listeners.forEach(listener => listener(online));
  }

  getStatus() {
    return this.isOnline;
  }

  onStatusChange(listener: (online: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }
}

export const networkTracker = new NetworkStatusTracker();

// Error categorization
function categorizeError(error: any): ErrorContext {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      retryable: true,
      delay: 1000,
      userMessage: 'Network connection problem. Retrying...'
    };
  }

  // HTTP status errors
  if (error.message.includes(':')) {
    const statusMatch = error.message.match(/^(\d+):/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      
      if (status === 401 || status === 403) {
        return {
          type: ErrorType.AUTH,
          retryable: false,
          delay: 0,
          userMessage: 'Authentication required. Please log in again.'
        };
      }
      
      if (status === 429) {
        return {
          type: ErrorType.RATE_LIMIT,
          retryable: true,
          delay: 5000,
          userMessage: 'Too many requests. Please wait a moment.'
        };
      }
      
      if (status >= 500) {
        return {
          type: ErrorType.SERVER,
          retryable: true,
          delay: 2000,
          userMessage: 'Server error. Retrying...'
        };
      }
      
      if (status >= 400) {
        return {
          type: ErrorType.CLIENT,
          retryable: false,
          delay: 0,
          userMessage: 'Request error. Please check your input.'
        };
      }
    }
  }

  // Default fallback
  return {
    type: ErrorType.NETWORK,
    retryable: !networkTracker.getStatus(),
    delay: 1000,
    userMessage: 'Something went wrong. Retrying...'
  };
}

// Smart retry function
function shouldRetry(failureCount: number, error: any): boolean {
  const context = categorizeError(error);
  
  // Don't retry non-retryable errors
  if (!context.retryable) return false;
  
  // Don't retry if offline (except for first attempt)
  if (!networkTracker.getStatus() && failureCount > 0) return false;
  
  // Max retry attempts based on error type
  const maxRetries = {
    [ErrorType.NETWORK]: 3,
    [ErrorType.SERVER]: 2,
    [ErrorType.RATE_LIMIT]: 1,
    [ErrorType.CLIENT]: 0,
    [ErrorType.AUTH]: 0,
  };

  return failureCount < maxRetries[context.type];
}

// Exponential backoff delay
function getRetryDelay(failureCount: number, error: any): number {
  const context = categorizeError(error);
  const baseDelay = context.delay;
  
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, failureCount);
  const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
  
  return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error = new Error(`${res.status}: ${text}`);
    const context = categorizeError(error);
    throw new RetryError(error.message, context);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: shouldRetry,
      retryDelay: getRetryDelay,
      // Refetch when back online
      refetchOnReconnect: true,
    },
    mutations: {
      retry: shouldRetry,
      retryDelay: getRetryDelay,
    },
  },
});
