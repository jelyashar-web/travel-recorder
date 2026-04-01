import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './i18n' // Import i18n configuration
import './index.css'

// Loading fallback
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white text-lg">טוען אפליקציה...</p>
      <p className="text-gray-400 text-sm mt-2">נא להמתין, זה עשוי לקחת רגע</p>
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
)
