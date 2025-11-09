// src/lib/subscription-utils.ts

import { supabase } from './supabase'; // Adjust path if needed

/**
 * Fetches the user's list of enabled feature keys (e.g., 'API_ACCESS', 'UNLIMITED_INVOICES').
 * @param userId The UUID of the authenticated user.
 * @returns An array of feature key strings.
 */
export async function fetchUserFeatureKeys(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .rpc('get_user_feature_keys', {
      p_user_id: userId,
    });

  if (error) {
    console.error('Error fetching user features:', error);
    return [];
  }

  // Supabase RPCs often return data as an array of objects; we expect an array of strings (TEXT).
  // We'll safely return the data, ensuring it's an array.
  return Array.isArray(data) ? data : [];
}

/**
 * Checks if a user has a single, specific feature.
 * @param userId The UUID of the authenticated user.
 * @param featureKey The unique key name of the feature (e.g., 'API_ACCESS').
 * @returns A boolean: true if the user has the feature, false otherwise.
 */
export async function checkUserFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('user_has_feature', {
      p_user_id: userId,
      p_feature_key: featureKey,
    })
    .single(); // Use .single() as the function returns a single boolean

  if (error) {
    console.error('Error checking single feature access:', error);
    return false;
  }

  return data ?? false;
}
