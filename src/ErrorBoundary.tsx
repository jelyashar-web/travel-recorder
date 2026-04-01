import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">שגיאה באפליקציה</h1>
            <p className="text-gray-400 mb-4">אירעה שגיאה בטעינת האפליקציה</p>
            {this.state.error && (
              <pre className="bg-gray-800 p-4 rounded-lg text-sm text-left overflow-auto max-h-48 text-red-300">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-blue-500 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
            >
              רענן את הדף
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
