import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { SeasonalGiftCard } from '@/components/gifts/SeasonalGiftCard';
import { SeasonalGiftDetailSheet } from '@/components/gifts/SeasonalGiftDetailSheet';
import { useAllGiftPricing } from '@/hooks/useGiftPricing';
import { Snowflake, Gift, Clock, Sparkles, TreePine, Star, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ChristmasGift {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  rarity: string;
  base_xp_cost: number;
  image_url: string | null;
  available_until: string | null;
  season: string | null;
}

const ChristmasGifts = () => {
  const [gifts, setGifts] = useState<ChristmasGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<ChristmasGift | null>(null);
  const { getPrice, loading: pricingLoading } = useAllGiftPricing();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchChristmasGifts();
  }, []);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      let endDate = now.getMonth() === 11 
        ? new Date(now.getFullYear() + 1, 0, 7, 0, 0, 0)
        : new Date(now.getFullYear(), 0, 7, 0, 0, 0);

      const diff = Math.max(0, endDate.getTime() - now.getTime());
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchChristmasGifts = async () => {
    const { data } = await supabase
      .from('gifts')
      .select('*')
      .or('season.eq.christmas,season.eq.winter,name.ilike.%christmas%,name.ilike.%xmas%,name.ilike.%snow%,name.ilike.%santa%')
      .order('rarity', { ascending: false });
    if (data) setGifts(data);
    setLoading(false);
  };

  // Calculate ACoin price (higher than base Nexa price)
  const getAcoinPrice = (basePrice: number, rarity: string) => {
    const multipliers: Record<string, number> = {
      legendary: 25,
      epic: 15,
      rare: 10,
      uncommon: 5,
      common: 3,
    };
    return Math.ceil(basePrice * (multipliers[rarity.toLowerCase()] || 5));
  };

  const snowflakes = useMemo(() => 
    Array.from({ length: 25 }).map((_, i) => ({
      id: i, 
      left: Math.random() * 100, 
      delay: Math.random() * 5, 
      duration: 8 + Math.random() * 7, 
      size: 10 + Math.random() * 16,
    })), []);

  const christmasLights = useMemo(() => 
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      color: ['text-red-500', 'text-green-500', 'text-yellow-500', 'text-blue-500'][i % 4],
      delay: i * 0.15,
    })), []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-950/20 to-green-950/20">
      <CustomLoader size="lg" />
    </div>
  );

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden bg-gradient-to-b from-background via-red-950/5 to-green-950/10">
      <SEO title="Christmas Limited Edition Gifts" description="Exclusive Christmas gifts - limited time only!" />
      
      {/* Snowflakes animation */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {snowflakes.map((f) => (
          <motion.div 
            key={f.id} 
            className="absolute text-white/30" 
            style={{ left: `${f.left}%`, top: -30 }}
            animate={{ y: ['0vh', '110vh'], rotate: [0, 360], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'linear' }}
          >
            <Snowflake size={f.size} />
          </motion.div>
        ))}
      </div>

      {/* Christmas lights at top */}
      <div className="fixed top-0 left-0 right-0 flex justify-around px-4 pt-2 z-10 pointer-events-none">
        {christmasLights.map((light) => (
          <motion.div
            key={light.id}
            className={`w-3 h-4 rounded-full ${light.color}`}
            animate={{ 
              opacity: [0.4, 1, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{ 
              duration: 1.5, 
              delay: light.delay, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{ 
              boxShadow: '0 0 10px currentColor, 0 0 20px currentColor',
            }}
          />
        ))}
      </div>

      <PageHeader title="🎄 Christmas Gifts" />

      {/* Hero Banner with festive decorations */}
      <div className="relative mx-4 mt-4 mb-6 overflow-hidden rounded-3xl">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-green-800" />
        
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-4 text-4xl">🎅</div>
          <div className="absolute top-4 right-6 text-3xl">⭐</div>
          <div className="absolute bottom-4 left-6 text-3xl">🎁</div>
          <div className="absolute bottom-2 right-4 text-4xl">🦌</div>
          <div className="absolute top-1/2 left-2 text-2xl">❄️</div>
          <div className="absolute top-1/2 right-2 text-2xl">🔔</div>
        </div>

        <div className="relative z-10 p-6 text-center">
          <motion.div 
            className="flex items-center justify-center gap-2 mb-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <TreePine className="w-7 h-7 text-green-300" />
            <h2 className="text-2xl font-bold text-white">Christmas Special</h2>
            <TreePine className="w-7 h-7 text-green-300" />
          </motion.div>
          
          <motion.p 
            className="text-white/80 text-sm mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ✨ Limited edition gifts - Exclusive ACoin prices! ✨
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-yellow-300" />
              <span className="text-yellow-300 text-sm font-medium">Sale ends in:</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              {[
                { v: countdown.days, l: 'Days' },
                { v: countdown.hours, l: 'Hrs' },
                { v: countdown.minutes, l: 'Min' },
                { v: countdown.seconds, l: 'Sec' },
              ].map((t, i) => (
                <motion.div 
                  key={i} 
                  className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[55px] border border-white/10"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl font-bold text-white tabular-nums">{String(t.v).padStart(2, '0')}</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">{t.l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ACoin badge */}
          <motion.div
            className="mt-4 inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">Pay with ACoin</span>
          </motion.div>
        </div>
      </div>

      {/* Gifts Grid */}
      <div className="px-4 relative z-10">
        <motion.div 
          className="flex items-center gap-2 mb-5"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold">Festive Collection</h3>
          <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
            🎄 {gifts.length} gifts
          </Badge>
        </motion.div>

        {gifts.length === 0 ? (
          <motion.div 
            className="text-center py-16 rounded-2xl bg-gradient-to-br from-red-500/10 to-green-500/10 border border-red-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Gift className="w-20 h-20 mx-auto text-red-400/50 mb-4" />
            <p className="text-muted-foreground">No Christmas gifts available yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Check back soon! 🎅</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {gifts.map((gift, i) => {
              const acoinPrice = getAcoinPrice(gift.base_xp_cost, gift.rarity);
              return (
                <SeasonalGiftCard
                  key={gift.id}
                  gift={gift}
                  price={acoinPrice}
                  onClick={() => setSelectedGift(gift)}
                  index={i}
                />
              );
            })}
          </div>
        )}

        {/* Bottom decoration */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-4 text-2xl opacity-40">
            <span>🎄</span>
            <span>⭐</span>
            <span>🎁</span>
            <span>❄️</span>
            <span>🎅</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Spread holiday cheer with exclusive gifts!
          </p>
        </motion.div>
      </div>

      {/* Gift Detail Sheet */}
      <SeasonalGiftDetailSheet
        gift={selectedGift}
        open={!!selectedGift}
        onOpenChange={(open) => !open && setSelectedGift(null)}
        currentPrice={selectedGift ? getAcoinPrice(selectedGift.base_xp_cost, selectedGift.rarity) : 0}
        totalSent={selectedGift ? (getPrice(selectedGift.id)?.totalSent ?? 0) : 0}
        priceMultiplier={selectedGift ? (getPrice(selectedGift.id)?.priceMultiplier ?? 1) : 1}
      />
    </div>
  );
};

export default ChristmasGifts;
