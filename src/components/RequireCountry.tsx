import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomLoader } from '@/components/ui/CustomLoader';

interface RequireCountryProps {
  children: ReactNode;
}

export const RequireCountry = ({ children }: RequireCountryProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasCountry, setHasCountry] = useState(true);

  useEffect(() => {
    const checkCountry = async () => {
      if (!user) {
        setChecking(false);
        setHasCountry(true); // No user = allow access (public pages)
        return;
      }

      // Check cache first - but only trust cache if country was set
      const cacheKey = `profile_country_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { hasCountry: cachedHasCountry, timestamp } = JSON.parse(cached);
          // Only use cache if country IS set and cache is fresh (5 minutes)
          if (cachedHasCountry && Date.now() - timestamp < 5 * 60 * 1000) {
            setHasCountry(true);
            setChecking(false);
            return;
          }
        } catch {
          // Invalid cache, continue to check
        }
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking country:', error);
          setHasCountry(true); // Don't block on error
          setChecking(false);
          return;
        }

        const countrySet = !!(profile?.country && profile.country.trim() !== '');
        setHasCountry(countrySet);
        
        // Only cache if country is set
        if (countrySet) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            hasCountry: true,
            timestamp: Date.now()
          }));
        } else {
          // Clear cache if country not set
          sessionStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.error('Error checking country:', error);
        setHasCountry(true); // Don't block on error
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading) {
      checkCountry();
    }
  }, [user, authLoading]);

  // Still loading auth or checking country
  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader size="lg" />
      </div>
    );
  }

  // Not logged in - allow access (public pages)
  if (!user) {
    return <>{children}</>;
  }

  // User is logged in but has no country - redirect to complete profile
  if (!hasCountry) {
    // Avoid redirect loop
    if (location.pathname === '/complete-profile') {
      return <>{children}</>;
    }
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};