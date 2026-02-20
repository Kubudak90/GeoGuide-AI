import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md text-center border border-gray-200 dark:border-gray-800">
            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
