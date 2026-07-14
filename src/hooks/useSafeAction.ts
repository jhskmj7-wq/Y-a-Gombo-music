import { useState, useCallback } from 'react';

/**
 * A hook to prevent double execution of asynchronous actions (e.g., button clicks).
 * Especially useful for payments, contract signatures, etc.
 */
export function useSafeAction<T = any>(action: (...args: any[]) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    if (loading) return; // Block double execution
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await action(...args);
      return result;
    } catch (err: any) {
      console.error("[useSafeAction] Caught Error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [action, loading]);

  return { execute, loading, error };
}
