import { Component, type ErrorInfo, type ReactNode } from 'react';
import { E } from '@/components/ui/glyphs';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-deep)] text-[var(--text-primary)] p-8">
        <div className="text-center max-w-md space-y-6">
          <div className="text-7xl"><E e="⚔" /></div>
          <h1 className="text-2xl font-bold">El héroe tropezó</h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Ocurrió un error inesperado en la aventura. No se perdió ningún progreso.
          </p>
          {this.state.error && (
            <details className="text-left text-xs text-[var(--text-muted)] bg-[var(--bg-panel)] rounded-xl p-3 border border-[var(--border)]">
              <summary className="cursor-pointer font-semibold mb-1">Detalles del error</summary>
              <pre className="whitespace-pre-wrap break-all">{this.state.error.message}</pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'var(--accent-gold)', color: 'var(--bg-deep)' }}
          >
            <E e="🔄" /> Recargar la aventura
          </button>
        </div>
      </div>
    );
  }
}
