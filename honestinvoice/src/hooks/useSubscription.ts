// src/lib/hooks/useSubscription.ts

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Assuming path to your supabase client
import { useAuth } from '../contexts/AuthContext'; // Get user/session from AuthContext
import { fetchUserFeatureKeys } from '../lib/subscription-utils'; // Import the new utility

// --- Interfaces for your plan data ---
export interface SubscriptionPlan {
  id: number
  plan_type: string
  invoice_limit: number // From subscription_plans table
  max_team_members: number // Assuming this column exists on subscription_plans
}

// Subscription is linked to the plan
export interface Subscription {
  id: number
  user_id: string
  status: string
  plans: SubscriptionPlan
}

// Usage data for the current month
export interface UsageData {
  invoices_created: number
  api_calls: number
  team_members: number
}

// --- Feature Keys Mapping ---
// Define your unique feature keys once (based on your features)
export const FeatureKeys = {
  // Free Features
  BASIC_CUSTOMER_MANAGEMENT: 'BASIC_CUSTOMER_MANAGEMENT',
  // Pro Features
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  UNLIMITED_INVOICES: 'UNLIMITED_INVOICES', // Key for Pro/Business
  // Business Features
  TEAM_MANAGEMENT: 'TEAM_MANAGEMENT',
  API_ACCESS: 'API_ACCESS',
  CUSTOM_INVOICE_TEMPLATES: 'CUSTOM_INVOICE_TEMPLATES',
  // Add all other keys from your subscription_features table
} as const;


// --- The Unified Hook ---
export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [features, setFeatures] = useState<Set<string>>(new Set()); // New feature set from RPC
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Subscription and Plan Limits
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plans:plan_id (plan_type, invoice_limit, max_team_members)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      let currentSubscription: Subscription;

      if (subData) {
        currentSubscription = subData as unknown as Subscription;
        setSubscription(currentSubscription);
      } else {
        // Default to Free Plan data (Plan ID 1) if no active subscription is found
        const { data: freePlanData } = await supabase
          .from('subscription_plans')
          .select('id, plan_type, invoice_limit, max_team_members')
          .eq('id', 1) // Assumes 1 is the ID for the Free Plan
          .single();

        currentSubscription = {
          id: -1, 
          user_id: user.id,
          status: 'active',
          plans: freePlanData as unknown as SubscriptionPlan
        } as unknown as Subscription;

        setSubscription(currentSubscription);
      }

      // 2. Fetch all Feature Keys using the new RPC function
      const keys = await fetchUserFeatureKeys(user.id);
      setFeatures(new Set(keys));

      // 3. Fetch current month usage
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageData } = await supabase
        .from('subscription_usage')
        .select('invoices_created, api_calls, team_members')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      setUsage(usageData || { invoices_created: 0, api_calls: 0, team_members: 0 });

    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      setFeatures(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user?.id]);


  // CENTRAL BOOLEAN CHECK FUNCTION (uses the fetched Set)
  const userHasFeature = (key: keyof typeof FeatureKeys): boolean => {
    return features.has(key);
  };

  // --- Invoice Limit Check (THE FIX) ---
  const canCreateInvoice = () => {
    if (!usage || !subscription) return false;

    // Check for the UNLIMITED_INVOICES feature key (Pro/Business)
    if (userHasFeature(FeatureKeys.UNLIMITED_INVOICES)) {
      return true;
    }

    // Free users (or any limited user) check against the limit from the plan
    const limit = subscription.plans.invoice_limit;

    if (limit > 0) {
      return usage.invoices_created < limit;
    }

    // If limit is 0 and they don't have the unlimited feature, assume no access
    return false; 
  };
  
  // --- Team Member Limit Check (Example) ---
  const canAddTeamMember = () => {
    if (!usage || !subscription) return false;
    
    // Check against the numerical limit from the plan
    const limit = subscription.plans.max_team_members || 0; 

    if (limit > 0) {
      return usage.team_members < limit;
    }
    
    // If limit is 0 and they have the TEAM_MANAGEMENT feature, use a default limit (e.g., 10)
    if (userHasFeature(FeatureKeys.TEAM_MANAGEMENT)) {
        return usage.team_members < 10;
    }

    return false;
  };

  // --- Simplified Feature Checker ---
  const hasFeature = (key: keyof typeof FeatureKeys) => userHasFeature(key);

  return {
    subscription,
    features,
    usage,
    loading,
    canCreateInvoice,
    canAddTeamMember,
    hasFeature,
    userHasFeature, // New, centralized check
    refreshSubscription: fetchSubscriptionData,
  };
}
