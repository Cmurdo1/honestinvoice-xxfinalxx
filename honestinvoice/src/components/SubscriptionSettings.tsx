import { useSubscription } from '../hooks/useSubscription'
import { useNavigate } from 'react-router-dom'
import { Crown, TrendingUp, Users, BarChart3, Zap, AlertCircle } from 'lucide-react'

export default function SubscriptionSettings() {
  const navigate = useNavigate()
  const { subscription, features, usage, loading, getPlanType } = useSubscription()
  const planType = getPlanType()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading subscription...</div>
      </div>
    )
  }

  const planNames = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    business: 'Business Plan'
  }

  const planIcons = {
    free: Zap,
    pro: Crown,
    business: BarChart3
  }

  const PlanIcon = planIcons[planType as keyof typeof planIcons] || Zap

  const usagePercentage = features?.max_invoices === -1
    ? 0
    : ((usage?.invoices_created || 0) / (features?.max_invoices || 1)) * 100

  const isNearLimit = usagePercentage > 80

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription & Billing</h2>
        <p className="text-gray-600">Manage your subscription plan and billing</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <PlanIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {planNames[planType as keyof typeof planNames]}
              </h3>
              <p className="text-sm text-gray-600">
                {subscription?.status === 'active' ? 'Active' : 'Free Plan'}
              </p>
            </div>
          </div>
          {planType !== 'business' && (
            <button
              onClick={() => navigate('/pricing')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Upgrade Plan
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Current Usage</h4>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">Invoices This Month</span>
              <span className="text-sm font-semibold text-gray-900">
                {usage?.invoices_created || 0}
                {features?.max_invoices !== -1 && ` / ${features?.max_invoices}`}
                {features?.max_invoices === -1 && ' (Unlimited)'}
              </span>
            </div>
            {features?.max_invoices !== -1 && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isNearLimit ? 'bg-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                {isNearLimit && (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      You're approaching your monthly limit
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {features?.has_api_access && (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">API Calls This Month</span>
                <span className="text-sm font-semibold text-gray-900">
                  {usage?.api_calls || 0}
                </span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Team Members</span>
              <span className="text-sm font-semibold text-gray-900">
                {usage?.team_members || 0} / {features?.max_team_members}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Plan Features</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className={`w-5 h-5 ${features?.has_analytics ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features?.has_analytics ? 'text-gray-900' : 'text-gray-500'}>
              Advanced Analytics
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Crown className={`w-5 h-5 ${features?.has_custom_branding ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features?.has_custom_branding ? 'text-gray-900' : 'text-gray-500'}>
              Custom Branding
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <BarChart3 className={`w-5 h-5 ${features?.has_advanced_reporting ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features?.has_advanced_reporting ? 'text-gray-900' : 'text-gray-500'}>
              Advanced Reporting
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Users className={`w-5 h-5 ${features?.max_team_members && features.max_team_members > 1 ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features?.max_team_members && features.max_team_members > 1 ? 'text-gray-900' : 'text-gray-500'}>
              Team Management
            </span>
          </div>
        </div>
      </div>

      {planType !== 'free' && subscription && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Billing Information</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subscription ID</span>
              <span className="text-gray-900 font-mono text-xs">
                {subscription.stripe_subscription_id}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className="text-green-600 font-semibold capitalize">
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {planType === 'free' && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h4 className="font-semibold text-primary-900 mb-2">
            Upgrade to unlock more features
          </h4>
          <p className="text-primary-700 text-sm mb-4">
            Get unlimited invoices, advanced analytics, custom branding, and more with a Pro or Business plan.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            View Plans
          </button>
        </div>
      )}
    </div>
  )
}
