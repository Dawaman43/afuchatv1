import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RequireBanCheckProps {
  children: React.ReactNode;
}

export function RequireBanCheck({ children }: RequireBanCheckProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.is_banned) {
          setIsBanned(true);
          navigate('/banned', { replace: true });
        }
      } catch (error) {
        console.error('Error checking ban status:', error);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkBanStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return null;
  }

  if (isBanned) {
    return null;
  }

  return <>{children}</>;
}
