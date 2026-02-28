import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Aegis Error Boundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-950">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="bg-red-900/20 p-4 rounded-full w-fit mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred in the Aegis interface."}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
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
