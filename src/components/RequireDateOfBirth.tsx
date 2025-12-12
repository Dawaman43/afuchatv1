import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomLoader } from '@/components/ui/CustomLoader';

interface RequireDateOfBirthProps {
  children: ReactNode;
}

export const RequireDateOfBirth = ({ children }: RequireDateOfBirthProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasDateOfBirth, setHasDateOfBirth] = useState(true);

  useEffect(() => {
    const checkDateOfBirth = async () => {
      if (!user) {
        setChecking(false);
        setHasDateOfBirth(true); // No user = allow access (public pages)
        return;
      }

      // Check cache first - but only trust cache if date_of_birth was set
      const cacheKey = `profile_dob_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { hasDateOfBirth: cachedHasDOB, timestamp } = JSON.parse(cached);
          // Only use cache if DOB IS set and cache is fresh (5 minutes)
          if (cachedHasDOB && Date.now() - timestamp < 5 * 60 * 1000) {
            setHasDateOfBirth(true);
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
          .select('date_of_birth')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking date of birth:', error);
          setHasDateOfBirth(true); // Don't block on error
          setChecking(false);
          return;
        }

        const dobSet = !!profile?.date_of_birth;
        setHasDateOfBirth(dobSet);
        
        // Only cache if DOB is set
        if (dobSet) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            hasDateOfBirth: true,
            timestamp: Date.now()
          }));
        } else {
          // Clear cache if DOB not set
          sessionStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.error('Error checking date of birth:', error);
        setHasDateOfBirth(true); // Don't block on error
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading) {
      checkDateOfBirth();
    }
  }, [user, authLoading]);

  // Still loading auth or checking DOB
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

  // User is logged in but has no date of birth - redirect to complete profile
  if (!hasDateOfBirth) {
    // Avoid redirect loop
    if (location.pathname === '/complete-profile') {
      return <>{children}</>;
    }
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};
