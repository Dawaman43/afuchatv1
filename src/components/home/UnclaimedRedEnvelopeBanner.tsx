import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, X, Sparkles } from 'lucide-react';
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
      // Fetch active red envelopes that haven't been fully claimed
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
        // Filter to only unclaimed envelopes (claimed_count < recipient_count)
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

  if (dismissed || envelopes.length === 0) return null;

  const currentEnvelope = envelopes[currentIndex];
  const remaining = currentEnvelope.recipient_count - currentEnvelope.claimed_count;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative overflow-hidden rounded-xl mx-3 mb-3"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
          <div className="absolute inset-0 opacity-30">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-300 text-2xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 20 - 10],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 2) * 40}%`,
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-4xl flex-shrink-0"
            >
              🧧
            </motion.div>
            
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm truncate">
                {currentEnvelope.sender.display_name} shared a Red Envelope!
              </p>
              <p className="text-white/80 text-xs">
                {remaining} of {currentEnvelope.recipient_count} remaining • {currentEnvelope.total_amount} Nexa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => navigate(`/red-envelope?claim=${currentEnvelope.id}`)}
              className="bg-yellow-400 hover:bg-yellow-300 text-red-700 font-bold shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Claim
            </Button>
            
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Pagination dots */}
        {envelopes.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {envelopes.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
