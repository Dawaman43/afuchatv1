import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Gift, X, ChevronRight } from 'lucide-react';

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
    // Check if already dismissed
    const dismissedUntil = sessionStorage.getItem('christmasBannerDismissed');
    if (dismissedUntil) {
      const dismissedTime = new Date(dismissedUntil);
      if (dismissedTime > new Date()) {
        setDismissed(true);
        return;
      }
    }

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
        .limit(4);

      if (!error && data) {
        setGifts(data);
      }
    } catch (error) {
      console.error('Error fetching Christmas gifts:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Dismiss for 12 hours
    const dismissUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
    sessionStorage.setItem('christmasBannerDismissed', dismissUntil.toISOString());
  };

  if (dismissed || !showBanner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mx-3 mt-3 mb-2"
    >
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-700 via-red-600 to-green-700 shadow-sm">
        <div className="flex items-center justify-between p-2.5 gap-2">
          {/* Left: Icon + Info */}
          <div 
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate('/gifts')}
          >
            <span className="text-xl flex-shrink-0">🎄</span>
            
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium text-xs">
                🎅 Christmas Gifts Are Here!
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {gifts.slice(0, 3).map((gift) => (
                  <span key={gift.id} className="text-sm">{gift.emoji}</span>
                ))}
                <span className="text-white/70 text-[10px] ml-1">Limited edition</span>
              </div>
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
      </div>
    </motion.div>
  );
};
