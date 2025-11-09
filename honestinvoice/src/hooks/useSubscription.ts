import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
// src/lib/hooks/useSubscription.ts (Update this file)

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Assuming you get user/session from AuthContext
import { fetchUserFeatureKeys } from '../lib/subscription-utils'; // Import the new utility

// Define your feature keys (optional, but good practice)
export const FeatureKeys = {
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  TEAM_MANAGEMENT: 'TEAM_MANAGEMENT',
  API_ACCESS: 'API_ACCESS',
  UNLIMITED_INVOICES: 'UNLIMITED_INVOICES',
  // ... add all your keys here
} as const;

export type FeatureMap = Record<keyof typeof FeatureKeys, boolean>;

export function useSubscription() {
  const { user } = useAuth(); // Get the user object from your auth context
  // Store the features as a Set for O(1) lookups
  const [features, setFeatures] = useState<Set<string>>(new Set());
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setIsLoadingFeatures(true);
      fetchUserFeatureKeys(user.id)
        .then(keys => {
          setFeatures(new Set(keys));
        })
        .catch(err => {
          console.error("Failed to load user features:", err);
          setFeatures(new Set()); // Clear features on error
        })
        .finally(() => {
          setIsLoadingFeatures(false);
        });
    } else {
      setFeatures(new Set());
      setIsLoadingFeatures(false);
    }
  }, [user?.id]);


  // THE NEW, CENTRAL CHECK FUNCTION
  const userHasFeature = (key: keyof typeof FeatureKeys): boolean => {
    return features.has(key);
  };

  return { 
    // ... other subscription data (plan_id, status, etc.)
    features,
    isLoadingFeatures,
    userHasFeature, // <-- This is the function you'll use everywhere
  };
}

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
  has_custom_templates: boolean
  has_automated_reminders: boolean
  has_advanced_transparency: boolean
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
// Inside fetchSubscription else block:
setSubscription({
  id: -1, // Use a placeholder ID
  user_id: user.id,
  stripe_subscription_id: '',
  stripe_customer_id: '',
  price_id: 'free',
  status: 'active',
  plans: { id: -1, price_id: 'free', plan_type: 'free', price: 0, monthly_limit: 0 }
} as Subscription)
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
    if (features.max_invoices === 50) return true // Unlimited
    return usage.invoices_created < features.max_invoices
  }

  const canAddTeamMember = () => {
    if (!features || !usage) return false
    return usage.team_members < features.max_team_members
  }

  const hasFeature = (feature: keyof SubscriptionFeatures) => {
    return features?.[feature] === true
  }

  // Specific feature checkers for new Business-tier features
  const canAccessAPI = () => hasFeature('has_api_access')
  const canUseCustomTemplates = () => hasFeature('has_custom_templates')
  const canUseAutomatedReminders = () => hasFeature('has_automated_reminders')
  const canUseAdvancedTransparency = () => hasFeature('has_advanced_transparency')

  // Comprehensive subscription verification for features
  const verifyFeatureAccess = (feature: 'api' | 'custom_templates' | 'automated_reminders' | 'advanced_transparency') => {
    const featureMap = {
      api: canAccessAPI(),
      custom_templates: canUseCustomTemplates(),
      automated_reminders: canUseAutomatedReminders(),
      advanced_transparency: canUseAdvancedTransparency()
    }
    
    return featureMap[feature] || false
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
    refreshSubscription,
    canAccessAPI,
    canUseCustomTemplates,
    canUseAutomatedReminders,
    canUseAdvancedTransparency,
    verifyFeatureAccess
  }
}
