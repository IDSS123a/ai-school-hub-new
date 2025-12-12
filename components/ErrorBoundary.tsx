import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
      this.setState({ hasError: false, error: undefined });
      window.location.reload(); 
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 min-h-[400px]">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-6 max-w-md">
            We encountered an unexpected error while rendering this page.
          </p>
          {this.state.error && (
            <div className="bg-white p-4 rounded-lg border border-red-100 text-left mb-6 max-w-lg w-full overflow-auto max-h-40 shadow-sm">
                <code className="text-xs text-red-500 font-mono block whitespace-pre-wrap">
                    {this.state.error.toString()}
                </code>
            </div>
          )}
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <RefreshCw size={18} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;