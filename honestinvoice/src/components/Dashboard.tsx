import { useState, useEffect, Suspense, lazy } from 'react'
import { Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  FileText,
  Users,
  DollarSign,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Search,
  TrendingUp,
  Award,
  Shield,
  UserCog,
  BarChart3,
  Calculator,
  Loader2,
  Crown,
  Key,
  Book,
  ShieldCheck
} from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'
import PaywallModal from './PaywallModal'
import Footer from './Footer'
import MobileNav from './MobileNav'
import toast from 'react-hot-toast'

// Lazy load components for better performance
const InvoiceList = lazy(() => import('./InvoiceList'))
const CreateInvoice = lazy(() => import('./CreateInvoice'))
const CustomerList = lazy(() => import('./CustomerList'))
const Analytics = lazy(() => import('./Analytics'))
const ClientPortal = lazy(() => import('./ClientPortal'))
const TeamManagement = lazy(() => import('./TeamManagement'))
const Reports = lazy(() => import('./Reports'))
const Settings = lazy(() => import('./Settings'))
const SubscriptionSettings = lazy(() => import('./SubscriptionSettings'))
const FairBillingCalculator = lazy(() => import('./FairBillingCalculator'))
const SocialProof = lazy(() => import('./SocialProof'))

// Loading component for suspense
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
  </div>
)

interface DashboardProps {
  session: Session
}

type ViewType = 'dashboard' | 'invoices' | 'customers' | 'client-portal' | 'team' | 'reports' | 'analytics' | 'settings' | 'subscription' | 'billing-calculator'

export default function Dashboard({ session }: DashboardProps) {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState('')
  const [paywallRequiredPlan, setPaywallRequiredPlan] = useState<'pro' | 'business'>('pro')
  const { canCreateInvoice, canAddTeamMember, hasFeature, getPlanType, usage, features } = useSubscription()
  const isAdmin = session.user?.email === 'murdochcpm_08@yahoo.com'
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    avgTransparencyScore: 0
  })

  useEffect(() => {
    loadStats()

    // Check for PWA shortcut navigation
    const pwaView = localStorage.getItem('pwa-initial-view')
    if (pwaView) {
      setCurrentView(pwaView as ViewType)
      localStorage.removeItem('pwa-initial-view')
    }
  }, [])

  const loadStats = async () => {
    try {
      // Get invoices count
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('grand_total, status')

      if (invoicesError) throw invoicesError

      if (invoices) {
        const total = invoices.length
        const paid = invoices.filter(inv => inv.status === 'paid').length
        const revenue = invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0)

        // Get transparency scores
        const { data: scores } = await supabase
          .from('transparency_scores')
          .select('score')

        const avgScore = scores && scores.length > 0
          ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
          : 0

        setStats({
          totalInvoices: total,
          totalRevenue: revenue,
          paidInvoices: paid,
          avgTransparencyScore: avgScore
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const renderContent = () => {
    if (showCreateInvoice) {
      return (
        <Suspense fallback={<ComponentLoader />}>
          <CreateInvoice
            onClose={() => {
              setShowCreateInvoice(false)
              loadStats()
            }}
          />
        </Suspense>
      )
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.totalInvoices}
                </div>
                <div className="text-sm text-gray-600">Total Invoices</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-accent-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-accent" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${stats.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.paidInvoices}
                </div>
                <div className="text-sm text-gray-600">Paid Invoices</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.avgTransparencyScore.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Avg Transparency Score</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    if (!canCreateInvoice()) {
                      setPaywallFeature('Create Invoice')
                      setPaywallRequiredPlan('pro')
                      setShowPaywall(true)
                      toast.error(`You've reached your monthly invoice limit (${usage?.invoices_created || 0} invoices). Upgrade to Pro for unlimited invoices.`)
                      return
                    }
                    setShowCreateInvoice(true)
                  }}
                  className="flex items-center space-x-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-left"
                >
                  <Plus className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-medium text-gray-900">Create Invoice</div>
                    <div className="text-sm text-gray-600">New invoice with transparency scoring</div>
                    {getPlanType() === 'free' && usage && (
                      <div className="text-xs text-primary mt-1">
                        {usage.invoices_created || 0}/50 invoices used
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('customers')}
                  className="flex items-center space-x-3 p-4 bg-accent-50 hover:bg-accent-100 rounded-lg transition-colors text-left"
                >
                  <Users className="w-6 h-6 text-accent" />
                  <div>
                    <div className="font-medium text-gray-900">Manage Customers</div>
                    <div className="text-sm text-gray-600">View and edit customer details</div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('billing-calculator')}
                  className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                >
                  <Calculator className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Fair Billing Calculator</div>
                    <div className="text-sm text-gray-600">Get transparent pricing suggestions</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Social Proof / Trust Metrics */}
            <Suspense fallback={<ComponentLoader />}>
              <SocialProof />
            </Suspense>

            {/* Recent Invoices */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
                <button
                  onClick={() => setCurrentView('invoices')}
                  className="text-primary hover:text-primary-600 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <Suspense fallback={<ComponentLoader />}>
                <InvoiceList limit={5} />
              </Suspense>
            </div>
          </div>
        )

      case 'invoices':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <InvoiceList />
          </Suspense>
        )

      case 'customers':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CustomerList />
          </Suspense>
        )

      case 'analytics':
        if (!hasFeature('has_analytics')) {
          setPaywallFeature('Advanced Analytics')
          setPaywallRequiredPlan('pro')
          setShowPaywall(true)
          return null
        }
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Analytics stats={stats} />
          </Suspense>
        )

      case 'client-portal':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ClientPortal />
          </Suspense>
        )

      case 'team':
        if (!canAddTeamMember()) {
          setPaywallFeature('Team Management')
          setPaywallRequiredPlan('business')
          setShowPaywall(true)
          return null
        }
        return (
          <Suspense fallback={<ComponentLoader />}>
            <TeamManagement />
          </Suspense>
        )

      case 'reports':
        if (!hasFeature('has_advanced_reporting')) {
          setPaywallFeature('Advanced Reporting')
          setPaywallRequiredPlan('business')
          setShowPaywall(true)
          return null
        }
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Reports />
          </Suspense>
        )

      case 'settings':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Settings />
          </Suspense>
        )

      case 'subscription':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SubscriptionSettings />
          </Suspense>
        )

      case 'billing-calculator':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <FairBillingCalculator />
          </Suspense>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        feature={paywallFeature}
        requiredPlan={paywallRequiredPlan}
        onClose={() => setShowPaywall(false)}
      />

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="HonestInvoice" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-gray-900">HonestInvoice</span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'dashboard'
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('invoices')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'invoices'
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Invoices
                </button>
                <button
                  onClick={() => setCurrentView('customers')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'customers'
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Customers
                </button>
                <button
                  onClick={() => setCurrentView('client-portal')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'client-portal'
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Client Portal
                </button>
                <button
                  onClick={() => setCurrentView('team')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'team'
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UserCog className="w-4 h-4 inline mr-2" />
                  Team
                </button>
                <button
                  onClick={() => setCurrentView('reports')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'reports'
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Reports
                </button>
                
                {/* Admin Navigation - Only visible to admin */}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => navigate('/admin')}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    >
                      <ShieldCheck className="w-4 h-4 inline mr-2" />
                      Admin
                    </button>
                    <button
                      onClick={() => navigate('/api-keys')}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Key className="w-4 h-4 inline mr-2" />
                      API Keys
                    </button>
                    <button
                      onClick={() => navigate('/api-docs')}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Book className="w-4 h-4 inline mr-2" />
                      API Docs
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Subscription Badge */}
              <button
                onClick={() => setCurrentView('subscription')}
                className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-primary-50 to-accent-50 hover:from-primary-100 hover:to-accent-100 rounded-full transition-colors border border-primary-200"
                title="View Subscription"
              >
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary hidden sm:inline">
                  {getPlanType().toUpperCase()}
                </span>
              </button>

              {/* Settings button - Mobile only */}
              <button
                onClick={() => setCurrentView('settings')}
                className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 touch-manipulation"
                title="Settings"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
              
              {/* Email - Desktop only to prevent mobile overflow */}
              <div className="hidden md:flex text-sm text-gray-600 max-w-xs truncate">
                {session.user?.email}
              </div>
              
              {/* Settings - Desktop only */}
              <button
                onClick={() => setCurrentView('settings')}
                className="hidden md:block text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              
              {/* Subscription - Desktop only */}
              <button
                onClick={() => setCurrentView('subscription')}
                className="hidden md:flex items-center space-x-1 text-primary hover:text-primary-600 p-2 rounded-md hover:bg-primary-50"
                title="Subscription"
              >
                <Crown className="w-5 h-5" />
                <span className="text-sm font-medium">Subscription</span>
              </button>
              
              {/* Logout - Desktop only */}
              <button
                onClick={handleSignOut}
                className="hidden md:block text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Mobile Navigation */}
      <MobileNav 
        currentView={currentView} 
        onViewChange={(view) => setCurrentView(view as ViewType)}
        onLogout={handleSignOut}
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}
