import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Assuming path to your supabase client
import { useAuth } from '../contexts/AuthContext'; // Get user/session from AuthContext
import { checkUserFeatureAccess, fetchUserFeatureKeys } from '../lib/subscription-utils'; // Import new utilities

// --- Interfaces for your plan data ---
// We pull 'invoice_limit' directly from the plan
export interface SubscriptionPlan {
  id: number
  plan_type: string
  invoice_limit: number // The limit (e.g., 50) from your subscription_plans table
}

// Subscription is linked to the plan
export interface Subscription {
  id: number
  user_id: string
  status: string
  plans: SubscriptionPlan // Contains the plan limits
  // Other Stripe details removed for brevity
}

// Usage data for the current month
export interface UsageData {
  invoices_created: number
  api_calls: number
  team_members: number
}

// --- Feature Keys Mapping ---
// Define your unique feature keys once
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
      // Fetching from 'user_subscriptions' which links to 'subscription_plans'
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plans:plan_id (plan_type, invoice_limit)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subData) {
        setSubscription(subData as unknown as Subscription);
      } else {
        // If no active subscription, default to Free Plan data (assuming Free plan ID is 1)
        const { data: freePlanData } = await supabase
          .from('subscription_plans')
          .select('id, plan_type, invoice_limit')
          .eq('id', 1) // Assuming 1 is the ID for the Free Plan
          .single();

        // Simulate a 'free' subscription object
        setSubscription({
          id: -1, 
          user_id: user.id,
          status: 'active',
          plans: freePlanData as unknown as SubscriptionPlan
        } as unknown as Subscription);
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

  // --- Invoice Limit Check (The FIX) ---
  const canCreateInvoice = () => {
    if (!usage || !subscription) return false;

    // Pro and Business users have the UNLIMITED_INVOICES feature key
    if (userHasFeature(FeatureKeys.UNLIMITED_INVOICES)) {
      return true;
    }

    // Free users (or any limited user) have the invoice_limit on their plan
    const limit = subscription.plans.invoice_limit;

    if (limit > 0) {
      return usage.invoices_created < limit;
    }

    // Default: if no limit is set and no unlimited feature, restrict access
    return false; 
  };
  
  // --- Team Member Limit Check (Example) ---
  const canAddTeamMember = () => {
    if (!usage || !subscription) return false;
    
    // We didn't migrate max_team_members, but assume it's stored on the plan
    const limit = subscription.plans.max_team_members || 0; // Assuming this column exists on subscription_plans
    
    // If the team limit is not set on the plan, check for the boolean feature
    if (limit === 0 && userHasFeature(FeatureKeys.TEAM_MANAGEMENT)) {
      // If feature is present and limit is 0, assume it's a fixed limit (e.g., 10)
      return usage.team_members < 10;
    }

    return usage.team_members < limit;
  };

  // --- Simplified Feature Checker (for legacy calls) ---
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
