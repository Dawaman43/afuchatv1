import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCheckResult {
  loading: boolean;
  isBanned: boolean;
  hasCountry: boolean;
  hasDateOfBirth: boolean;
  profileComplete: boolean;
  refetch: () => void;
}

const CACHE_KEY_PREFIX = 'profile_check_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global state to prevent duplicate requests
let globalPromise: Promise<any> | null = null;
let globalUserId: string | null = null;
let globalData: {
  isBanned: boolean;
  hasCountry: boolean;
  hasDateOfBirth: boolean;
  profileComplete: boolean;
} | null = null;

export const useProfileCheck = (): ProfileCheckResult => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    isBanned: false,
    hasCountry: true,
    hasDateOfBirth: true,
    profileComplete: true,
  });

  const fetchProfile = useCallback(async (userId: string, forceRefresh = false) => {
    // If we already have data for this user and not forcing refresh, use it
    if (!forceRefresh && globalUserId === userId && globalData) {
      setData(globalData);
      setLoading(false);
      return;
    }

    // If there's already a request in flight for this user, wait for it
    if (globalUserId === userId && globalPromise) {
      try {
        const result = await globalPromise;
        setData(result);
        setLoading(false);
        return;
      } catch {
        // Continue to fetch
      }
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    
    // Check cache first (only if not forcing refresh)
    if (!forceRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (cachedData.profileComplete && Date.now() - timestamp < CACHE_DURATION) {
            globalData = cachedData;
            globalUserId = userId;
            setData(cachedData);
            setLoading(false);
            return;
          }
        } catch {
          // Invalid cache, continue to check
        }
      }
    }

    // Create a new promise for this request
    globalUserId = userId;
    globalPromise = (async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_banned, country, date_of_birth, display_name, handle, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile:', error);
        return {
          isBanned: false,
          hasCountry: true,
          hasDateOfBirth: true,
          profileComplete: true,
        };
      }

      const banned = profile?.is_banned === true;
      const countrySet = !!(profile?.country && profile.country.trim() !== '');
      const dobSet = !!profile?.date_of_birth;
      const complete = !!(
        profile?.display_name &&
        profile?.handle &&
        profile?.country &&
        profile?.avatar_url &&
        profile?.date_of_birth
      );

      return {
        isBanned: banned,
        hasCountry: countrySet,
        hasDateOfBirth: dobSet,
        profileComplete: complete,
      };
    })();

    try {
      const result = await globalPromise;
      globalData = result;
      
      // Cache only if profile is complete and not banned
      if (result.profileComplete && !result.isBanned) {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      } else {
        sessionStorage.removeItem(cacheKey);
      }
      
      setData(result);
    } catch (error) {
      console.error('Error checking profile:', error);
      setData({
        isBanned: false,
        hasCountry: true,
        hasDateOfBirth: true,
        profileComplete: true,
      });
    } finally {
      globalPromise = null;
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (user) {
      setLoading(true);
      globalData = null;
      globalPromise = null;
      fetchProfile(user.id, true);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setData({
        isBanned: false,
        hasCountry: true,
        hasDateOfBirth: true,
        profileComplete: true,
      });
      setLoading(false);
      return;
    }

    fetchProfile(user.id);
  }, [user, authLoading, fetchProfile]);

  return useMemo(() => ({
    loading: authLoading || loading,
    ...data,
    refetch,
  }), [authLoading, loading, data, refetch]);
};

// Helper to clear profile cache (call after profile update)
export const clearProfileCache = (userId: string) => {
  sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
  sessionStorage.removeItem(`profile_country_${userId}`);
  sessionStorage.removeItem(`profile_dob_${userId}`);
  // Clear global cache
  globalData = null;
  globalPromise = null;
  globalUserId = null;
};
