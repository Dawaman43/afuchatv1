import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SubscriptionExpiryBannerProps {
  daysThreshold?: number; // Show banner if expiring within this many days
}

export function SubscriptionExpiryBanner({ daysThreshold = 7 }: SubscriptionExpiryBannerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Also trigger cleanup of expired subscriptions
        await supabase.rpc('cleanup_expired_subscriptions');

        const { data } = await supabase
          .from('user_subscriptions')
          .select('expires_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.expires_at) {
          const expiry = new Date(data.expires_at);
          const now = new Date();
          const diffTime = expiry.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setExpiresAt(expiry);
          setDaysRemaining(diffDays);
        } else {
          setExpiresAt(null);
          setDaysRemaining(null);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check dismissal from session storage
    const dismissKey = `subscription_expiry_dismissed_${user?.id}`;
    const wasDismissed = sessionStorage.getItem(dismissKey);
    if (wasDismissed) {
      setDismissed(true);
    }

    checkSubscription();
  }, [user]);

  const handleDismiss = () => {
    if (user) {
      sessionStorage.setItem(`subscription_expiry_dismissed_${user.id}`, 'true');
    }
    setDismissed(true);
  };

  // Don't show if loading, dismissed, no subscription, or not expiring soon
  if (loading || dismissed || !expiresAt || daysRemaining === null || daysRemaining > daysThreshold) {
    return null;
  }

  const isUrgent = daysRemaining <= 3;
  const isExpired = daysRemaining <= 0;

  return (
    <div 
      className={`relative px-4 py-3 flex items-center gap-3 ${
        isExpired 
          ? 'bg-destructive/15 border-b border-destructive/30' 
          : isUrgent 
            ? 'bg-orange-500/15 border-b border-orange-500/30' 
            : 'bg-yellow-500/15 border-b border-yellow-500/30'
      }`}
    >
      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
        isExpired ? 'text-destructive' : isUrgent ? 'text-orange-500' : 'text-yellow-600'
      }`} />
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          isExpired ? 'text-destructive' : isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-yellow-700 dark:text-yellow-400'
        }`}>
          {isExpired 
            ? 'Your premium subscription has expired!'
            : daysRemaining === 1 
              ? 'Your premium subscription expires tomorrow!'
              : `Your premium subscription expires in ${daysRemaining} days`
          }
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isExpired 
            ? 'Renew now to keep your premium features and verified badge.'
            : `Expires on ${expiresAt.toLocaleDateString()}`
          }
        </p>
      </div>

      <Button 
        size="sm" 
        variant={isExpired ? "destructive" : "default"}
        onClick={() => navigate('/premium')}
        className="flex-shrink-0 gap-1.5"
      >
        <Crown className="h-4 w-4" />
        {isExpired ? 'Renew' : 'Extend'}
      </Button>

      <button 
        onClick={handleDismiss}
        className="p-1 rounded-full hover:bg-background/50 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}