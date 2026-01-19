import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkState {
  isConnected: boolean;
  isChecking: boolean;
}

// Simple network check by attempting to fetch a small resource
async function checkConnection(): Promise<boolean> {
  try {
    // Use a simple HEAD request to a reliable endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

export function useNetwork() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true, // Assume connected initially
    isChecking: false,
  });
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkNetwork = useCallback(async () => {
    setNetworkState((prev) => ({ ...prev, isChecking: true }));
    const isConnected = await checkConnection();
    setNetworkState({ isConnected, isChecking: false });
    return isConnected;
  }, []);

  useEffect(() => {
    // Check on mount
    checkNetwork();

    // Periodic check every 30 seconds
    checkIntervalRef.current = setInterval(checkNetwork, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkNetwork]);

  return {
    isConnected: networkState.isConnected,
    isOffline: !networkState.isConnected,
    isChecking: networkState.isChecking,
    checkNetwork,
  };
}

// Retry utility for API calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true, onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        onRetry?.(attempt, lastError);
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

function isNonRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Don't retry auth errors or validation errors
    if (error.message.includes('401') || error.message.includes('403')) {
      return true;
    }
    if (error.message.includes('400') || error.message.includes('422')) {
      return true;
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Hook for handling API calls with loading/error states
export function useApiCall<T>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}
