import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unexpected runtime errors anywhere in the component tree and
 * shows a calm, on-brand recovery screen instead of a blank white page.
 * This is standard practice in production-grade React apps.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production you would send this to an error-tracking service
    // (e.g. Sentry) instead of just logging it.
    console.error('Calculator Hub crashed:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-main, #09090b)',
            color: 'var(--text-main, #f4f4f5)',
          }}
        >
          <AlertTriangle size={40} color="var(--accent-golden, #f59e0b)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-muted, #a1a1aa)', maxWidth: 380, margin: 0 }}>
            This section hit an unexpected error. Your data hasn't been lost —
            try reloading this view.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--accent-voltage, #10b981)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
