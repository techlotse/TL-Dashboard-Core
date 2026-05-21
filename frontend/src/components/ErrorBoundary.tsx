import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0a0e1a] text-white p-8">
          <div className="max-w-xl text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-2xl font-semibold">Dashboard crashed</h1>
            <p className="text-white/60 text-sm font-mono bg-white/5 rounded-xl px-4 py-3 text-left break-all">
              {this.state.error.message}
            </p>
            <p className="text-white/40 text-xs">Open DevTools (F12) → Console for the full stack trace</p>
            <button
              className="mt-4 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
