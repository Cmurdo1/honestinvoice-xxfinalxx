import { Toaster } from 'sonner'
import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import { AuthProvider } from './contexts/AuthContext'
import { usePWA } from './hooks/usePWA'

import OfflineIndicator from './components/OfflineIndicator'
import './App.css'

// Lazy load main components for code splitting
const AuthPage = lazy(() => import('./components/AuthPage'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const PricingPage = lazy(() => import('./components/PricingPage'))
const APIKeyManagement = lazy(() => import('./components/APIKeyManagement'))
const APIDocumentation = lazy(() => import('./components/APIDocumentation'))

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

function AppContent() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize PWA features
  usePWA()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        richColors 
        expand={false}
        duration={4000}
      />
      <OfflineIndicator />

      
      <Routes>
        <Route path="/pricing" element={
          <Suspense fallback={<LoadingScreen />}>
            <PricingPage />
          </Suspense>
        } />
        
        <Route path="/api-keys" element={
          <Suspense fallback={<LoadingScreen />}>
            {!session ? <Navigate to="/" /> : <APIKeyManagement />}
          </Suspense>
        } />
        
        <Route path="/api-docs" element={
          <Suspense fallback={<LoadingScreen />}>
            {!session ? <Navigate to="/" /> : <APIDocumentation />}
          </Suspense>
        } />
        
        <Route path="/*" element={
          <Suspense fallback={<LoadingScreen />}>
            {!session ? <AuthPage /> : <Dashboard session={session} />}
          </Suspense>
        } />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
