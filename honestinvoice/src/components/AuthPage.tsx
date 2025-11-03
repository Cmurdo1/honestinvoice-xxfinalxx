import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { ArrowRight, Shield, TrendingUp, Users, CheckCircle2 } from 'lucide-react'
import Footer from './Footer'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })
        if (error) throw error
        if (data.user) {
          toast.success('Please check your email for verification link!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="HonestInvoice Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-2xl font-bold text-gray-900">HonestInvoice</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Marketing Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                The Most Trusted Invoicing Platform
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Build trust through transparency. Manage invoices, track payments, and grow your business with confidence.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="rounded-lg bg-primary-100 p-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Transparency Scoring</h3>
                  <p className="text-gray-600">Rate and verify invoice honesty with visual trust indicators</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-lg bg-accent-100 p-3">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Client Portal</h3>
                  <p className="text-gray-600">Secure client access with invoice verification and payment tracking</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-lg bg-primary-100 p-3">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Complete Audit Trails</h3>
                  <p className="text-gray-600">Full transparency in client interactions and communication history</p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Trusted by businesses worldwide</p>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">256-bit</div>
                  <div className="text-sm text-gray-600">Encryption</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">SOC 2</div>
                  <div className="text-sm text-gray-600">Compliant</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {isSignUp ? 'Start building trust with transparent invoicing' : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:text-primary-600 font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
