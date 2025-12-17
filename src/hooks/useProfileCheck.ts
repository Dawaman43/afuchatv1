import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCheckResult {
  loading: boolean;
  isBanned: boolean;
  hasCountry: boolean;
  hasDateOfBirth: boolean;
  profileComplete: boolean;
}

const CACHE_KEY_PREFIX = 'profile_check_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProfileCheck = (): ProfileCheckResult => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [hasCountry, setHasCountry] = useState(true);
  const [hasDateOfBirth, setHasDateOfBirth] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        // No user = allow access (public pages)
        setLoading(false);
        setIsBanned(false);
        setHasCountry(true);
        setHasDateOfBirth(true);
        setProfileComplete(true);
        return;
      }

      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if fresh and profile is complete
          if (data.profileComplete && Date.now() - timestamp < CACHE_DURATION) {
            setIsBanned(data.isBanned);
            setHasCountry(data.hasCountry);
            setHasDateOfBirth(data.hasDateOfBirth);
            setProfileComplete(data.profileComplete);
            setLoading(false);
            return;
          }
        } catch {
          // Invalid cache, continue to check
        }
      }

      try {
        // Single query for all profile fields
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_banned, country, date_of_birth, display_name, handle, avatar_url')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle to avoid throwing on no rows

        if (error) {
          console.error('Error checking profile:', error);
          // On error, don't block user - allow access
          setIsBanned(false);
          setHasCountry(true);
          setHasDateOfBirth(true);
          setProfileComplete(true);
          setLoading(false);
          return;
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

        setIsBanned(banned);
        setHasCountry(countrySet);
        setHasDateOfBirth(dobSet);
        setProfileComplete(complete);

        // Cache only if profile is complete
        if (complete && !banned) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: {
              isBanned: banned,
              hasCountry: countrySet,
              hasDateOfBirth: dobSet,
              profileComplete: complete
            },
            timestamp: Date.now()
          }));
        } else {
          // Clear cache if profile not complete
          sessionStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, don't block
        setIsBanned(false);
        setHasCountry(true);
        setHasDateOfBirth(true);
        setProfileComplete(true);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading]);

  return {
    loading: authLoading || loading,
    isBanned,
    hasCountry,
    hasDateOfBirth,
    profileComplete
  };
};

// Helper to clear profile cache (call after profile update)
export const clearProfileCache = (userId: string) => {
  sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
  sessionStorage.removeItem(`profile_country_${userId}`);
  sessionStorage.removeItem(`profile_dob_${userId}`);
};
