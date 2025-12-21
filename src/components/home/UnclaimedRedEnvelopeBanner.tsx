import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RedEnvelope {
  id: string;
  total_amount: number;
  recipient_count: number;
  claimed_count: number;
  sender: {
    display_name: string;
    avatar_url: string | null;
  };
}

export const UnclaimedRedEnvelopeBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [envelopes, setEnvelopes] = useState<RedEnvelope[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedUntil = sessionStorage.getItem('redEnvelopeBannerDismissed');
    if (dismissedUntil) {
      const dismissedTime = new Date(dismissedUntil);
      if (dismissedTime > new Date()) {
        setDismissed(true);
        return;
      }
    }
    fetchUnclaimedEnvelopes();
  }, [user]);

  useEffect(() => {
    if (envelopes.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % envelopes.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [envelopes.length]);

  const fetchUnclaimedEnvelopes = async () => {
    try {
      const { data, error } = await supabase
        .from('red_envelopes')
        .select(`
          id,
          total_amount,
          recipient_count,
          claimed_count,
          sender_id,
          profiles!red_envelopes_sender_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching red envelopes:', error);
        return;
      }

      if (data) {
        const unclaimed = data
          .filter((e: any) => (e.claimed_count || 0) < e.recipient_count)
          .slice(0, 5);
        
        setEnvelopes(unclaimed.map((e: any) => ({
          id: e.id,
          total_amount: e.total_amount,
          recipient_count: e.recipient_count,
          claimed_count: e.claimed_count || 0,
          sender: {
            display_name: e.profiles?.display_name || 'Someone',
            avatar_url: e.profiles?.avatar_url
          }
        })));
      }
    } catch (error) {
      console.error('Error fetching red envelopes:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Dismiss for 2 hours
    const dismissUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    sessionStorage.setItem('redEnvelopeBannerDismissed', dismissUntil.toISOString());
  };

  if (dismissed || envelopes.length === 0) return null;

  const currentEnvelope = envelopes[currentIndex];
  const remaining = currentEnvelope.recipient_count - currentEnvelope.claimed_count;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mx-3 mt-3 mb-2"
      >
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-600 to-orange-500 shadow-sm">
          <div className="flex items-center justify-between p-2.5 gap-2">
            {/* Left: Icon + Info */}
            <div 
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/red-envelope?claim=${currentEnvelope.id}`)}
            >
              <span className="text-xl flex-shrink-0">🧧</span>
              
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-xs truncate">
                  {currentEnvelope.sender.display_name} shared a Red Envelope
                </p>
                <p className="text-white/70 text-[10px]">
                  {remaining} left • {currentEnvelope.total_amount} Nexa
                </p>
              </div>
              
              <ChevronRight className="w-4 h-4 text-white/70 flex-shrink-0" />
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>

          {/* Pagination dots */}
          {envelopes.length > 1 && (
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1 pb-0.5">
              {envelopes.map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
