import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { Check, Loader2, Crown, Zap, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    icon: Zap,
    description: 'Perfect for getting started',
    popular: false,
    features: [
      '50 invoices per month',
      'Basic customer management',
      'Standard invoice templates',
      'Email support',
      'Basic transparency scoring'
    ],
    limitations: [
      'No analytics dashboard',
      'No custom branding',
      'No API access',
      'No team management'
    ]
  },
  pro: {
    name: 'Pro',
    price: 19,
    icon: Crown,
    description: 'For growing businesses',
    popular: true,
    features: [
      'Unlimited invoices',
      'Advanced analytics dashboard',
      'Custom branding',
      'Priority email support',
      'API access',
      'Advanced transparency features',
      'Custom invoice templates',
      'Automated reminders'
    ],
    limitations: []
  },
  business: {
    name: 'Business',
    price: 49,
    icon: Building2,
    description: 'For established teams',
    popular: false,
    features: [
      'Everything in Pro',
      'Team management (up to 10 users)',
      'Advanced reporting',
      'Phone support',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
      'SLA guarantee'
    ],
    limitations: []
  }
}

export default function PricingPage() {
  const { user } = useAuth()
  const { getPlanType, refreshSubscription } = useSubscription()
  const [loading, setLoading] = useState<string | null>(null)
  const currentPlan = getPlanType()

  const handleSubscribe = async (planType: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe')
      return
    }

    if (planType === 'free') {
      toast.error('You are already on the free plan')
      return
    }

    if (planType === currentPlan) {
      toast.error(`You are already subscribed to the ${planType} plan`)
      return
    }

    setLoading(planType)

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          customerEmail: user.email
        }
      })

      if (error) throw error

      if (data?.data?.checkoutUrl) {
        toast.success('Redirecting to payment...')
        window.location.href = data.data.checkoutUrl
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Failed to create subscription')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose the Perfect Plan for Your Business
          </h1>
          <p className="text-xl text-gray-600">
            Start free and upgrade as you grow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(PLAN_FEATURES).map(([planType, plan]) => {
            const Icon = plan.icon
            const isCurrent = currentPlan === planType
            const isPopular = plan.popular

            return (
              <div
                key={planType}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  isPopular ? 'ring-2 ring-primary transform scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-8 -translate-y-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  {isCurrent && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Current Plan
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(planType)}
                  disabled={loading === planType || isCurrent || planType === 'free'}
                  className={`w-full py-3 px-6 rounded-lg font-semibold mb-6 transition-colors ${
                    isCurrent || planType === 'free'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-primary text-white hover:bg-primary-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading === planType ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : planType === 'free' ? (
                    'Free Forever'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations?.map((limitation, index) => (
                    <div key={`limit-${index}`} className="flex items-start space-x-3 opacity-50">
                      <span className="text-gray-400 mt-0.5">×</span>
                      <span className="text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Need a custom plan?
          </h3>
          <p className="text-gray-600 mb-6">
            Contact us for enterprise pricing and custom features tailored to your needs
          </p>
          <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  )
}
