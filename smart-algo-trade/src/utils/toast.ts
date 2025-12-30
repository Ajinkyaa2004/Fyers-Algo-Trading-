import { toast } from 'sonner';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: '#065f46',
        color: '#d1fae5',
        border: '1px solid #047857',
      },
    });
  },
  
  error: (message: string) => {
    toast.error(message, {
      style: {
        background: '#7f1d1d',
        color: '#fecaca',
        border: '1px solid #991b1b',
      },
    });
  },
  
  warning: (message: string) => {
    toast.warning(message, {
      style: {
        background: '#78350f',
        color: '#fef3c7',
        border: '1px solid #92400e',
      },
    });
  },
  
  info: (message: string) => {
    toast.info(message, {
      style: {
        background: '#1e293b',
        color: '#e2e8f0',
        border: '1px solid #334155',
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      style: {
        background: '#1e293b',
        color: '#e2e8f0',
        border: '1px solid #334155',
      },
    });
  },
};
