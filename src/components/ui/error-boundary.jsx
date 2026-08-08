import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('[FareSplit] Global React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-slate-900 p-6 text-white">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center shadow-2xl">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-600/20 text-indigo-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Something went wrong</h2>
            <p className="mt-2 text-xs text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred while loading FareSplit.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 h-11 w-full rounded-xl bg-indigo-600 font-bold text-white transition hover:bg-indigo-500 shadow-lg"
            >
              Reload FareSplit
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
