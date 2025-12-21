import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChristmasGift {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  base_xp_cost: number;
}

export const ChristmasGiftsBanner = () => {
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<ChristmasGift[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if it's Christmas season (December 1 - January 6)
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    
    const isChristmasSeason = 
      (month === 11) || // December
      (month === 0 && day <= 6); // January 1-6
    
    if (isChristmasSeason) {
      setShowBanner(true);
      fetchChristmasGifts();
    }
  }, []);

  const fetchChristmasGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('id, name, emoji, rarity, base_xp_cost')
        .or('season.eq.christmas,season.eq.winter,name.ilike.%christmas%,name.ilike.%xmas%')
        .limit(5);

      if (!error && data) {
        setGifts(data);
      }
    } catch (error) {
      console.error('Error fetching Christmas gifts:', error);
    }
  };

  // Check session storage for dismissal
  useEffect(() => {
    const dismissedUntil = sessionStorage.getItem('christmasBannerDismissed');
    if (dismissedUntil) {
      const dismissedTime = new Date(dismissedUntil);
      if (dismissedTime > new Date()) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    // Dismiss for 6 hours
    const dismissUntil = new Date(Date.now() + 6 * 60 * 60 * 1000);
    sessionStorage.setItem('christmasBannerDismissed', dismissUntil.toISOString());
  };

  if (dismissed || !showBanner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl mx-3 mb-3"
    >
      {/* Festive background */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-red-600 to-green-700">
        {/* Snow effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white text-xs opacity-60"
              initial={{ y: -10, x: Math.random() * 100 + '%' }}
              animate={{
                y: ['0%', '100%'],
                x: [
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`,
                ],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              ❄
            </motion.div>
          ))}
        </div>
        
        {/* Sparkle decorations */}
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              style={{
                left: `${10 + i * 25}%`,
                top: '10%',
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl flex-shrink-0"
            >
              🎄
            </motion.div>
            
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm flex items-center gap-1">
                <span>🎅 Christmas Gifts Are Here!</span>
              </p>
              <p className="text-white/80 text-xs">
                Limited edition festive gifts available now!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => navigate('/gifts')}
              className="bg-white hover:bg-white/90 text-green-700 font-bold shadow-lg"
            >
              <Gift className="w-4 h-4 mr-1" />
              Send Gifts
            </Button>
            
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Gift preview row */}
        {gifts.length > 0 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            {gifts.map((gift, i) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1"
              >
                <span className="text-lg">{gift.emoji}</span>
                <span className="text-white text-xs font-medium truncate max-w-[80px]">
                  {gift.name}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
