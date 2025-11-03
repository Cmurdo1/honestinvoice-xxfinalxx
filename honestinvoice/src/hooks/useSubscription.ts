import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface SubscriptionPlan {
  id: number
  price_id: string
  plan_type: string
  price: number
  monthly_limit: number
}

export interface Subscription {
  id: number
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  price_id: string
  status: string
  plans: SubscriptionPlan
}

export interface SubscriptionFeatures {
  max_invoices: number
  max_team_members: number
  has_analytics: boolean
  has_custom_branding: boolean
  has_api_access: boolean
  has_advanced_reporting: boolean
  has_priority_support: boolean
}

export interface UsageData {
  invoices_created: number
  api_calls: number
  team_members: number
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Fetch active subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans!price_id(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (subData) {
        setSubscription(subData as Subscription)
        
        // Fetch features for this plan
        const { data: featuresData } = await supabase
          .from('subscription_features')
          .select('*')
          .eq('plan_type', subData.plans.plan_type)
          .single()

        setFeatures(featuresData)
      } else {
        // Default to free plan if no subscription
        const { data: featuresData } = await supabase
          .from('subscription_features')
          .select('*')
          .eq('plan_type', 'free')
          .single()

        setFeatures(featuresData)
      }

      // Fetch current month usage
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const { data: usageData } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle()

      setUsage(usageData || { invoices_created: 0, api_calls: 0, team_members: 0 })
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  const canCreateInvoice = () => {
    if (!features || !usage) return false
    if (features.max_invoices === -1) return true // Unlimited
    return usage.invoices_created < features.max_invoices
  }

  const canAddTeamMember = () => {
    if (!features || !usage) return false
    return usage.team_members < features.max_team_members
  }

  const hasFeature = (feature: keyof SubscriptionFeatures) => {
    return features?.[feature] === true
  }

  const getPlanType = () => {
    return subscription?.plans.plan_type || 'free'
  }

  const refreshSubscription = () => {
    return fetchSubscription()
  }

  return {
    subscription,
    features,
    usage,
    loading,
    canCreateInvoice,
    canAddTeamMember,
    hasFeature,
    getPlanType,
    refreshSubscription
  }
}
