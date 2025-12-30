import React from 'react';
import { AlertCircle, CheckCircle, InfoIcon, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      position: (options?.position || 'top-right') as any,
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: options?.duration || 4000,
      position: (options?.position || 'top-right') as any,
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      duration: options?.duration || 3000,
      position: (options?.position || 'top-right') as any,
    });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      duration: options?.duration || 3000,
      position: (options?.position || 'top-right') as any,
    });
  },
  
  loading: (message: string) => {
    return toast.loading(message);
  },
  
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

/**
 * Hook for error handling with automatic toast notifications
 */
export function useErrorHandler() {
  return {
    handle: (error: Error | string, context?: string) => {
      const message = error instanceof Error ? error.message : String(error);
      const fullMessage = context ? `${context}: ${message}` : message;
      
      console.error(fullMessage);
      showToast.error(fullMessage);
    },
    
    handleAsync: async <T,>(
      promise: Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        return await promise;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const fullMessage = context ? `${context}: ${message}` : message;
        
        console.error(fullMessage);
        showToast.error(fullMessage);
        return null;
      }
    },
  };
}
