import React, { ReactNode } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-red-500 rounded-lg p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={24} />
              <h2 className="text-red-500 text-lg font-semibold">Something went wrong</h2>
            </div>
            
            <p className="text-zinc-400 mb-4 text-sm">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            
            <details className="mb-4">
              <summary className="text-zinc-500 text-xs cursor-pointer hover:text-zinc-400">
                Error details
              </summary>
              <pre className="mt-2 bg-black p-2 rounded text-xs text-zinc-400 overflow-auto max-h-40">
                {this.state.error.stack}
              </pre>
            </details>
            
            <button
              onClick={this.resetError}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
