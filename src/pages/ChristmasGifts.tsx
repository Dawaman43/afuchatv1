import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { SeasonalGiftCard } from '@/components/gifts/SeasonalGiftCard';
import { SeasonalGiftDetailSheet } from '@/components/gifts/SeasonalGiftDetailSheet';
import { useAllGiftPricing } from '@/hooks/useGiftPricing';
import { Snowflake, Gift, Clock, Sparkles, TreePine } from 'lucide-react';
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

  const snowflakes = useMemo(() => 
    Array.from({ length: 15 }).map((_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 5, duration: 5 + Math.random() * 5, size: 8 + Math.random() * 12,
    })), []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><CustomLoader size="lg" /></div>;

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      <SEO title="Christmas Limited Edition Gifts" description="Exclusive Christmas gifts - limited time only!" />
      
      {/* Snowflakes */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {snowflakes.map((f) => (
          <motion.div key={f.id} className="absolute text-white/20" style={{ left: `${f.left}%`, top: -20 }}
            animate={{ y: ['0vh', '110vh'], rotate: [0, 360] }}
            transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'linear' }}>
            <Snowflake size={f.size} />
          </motion.div>
        ))}
      </div>

      <PageHeader title="Christmas Gifts" />

      {/* Hero Banner */}
      <div className="relative mx-4 mt-4 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-green-800 p-6">
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TreePine className="w-6 h-6 text-green-300" />
            <h2 className="text-2xl font-bold text-white">Christmas Special</h2>
          </div>
          <p className="text-white/80 text-sm mb-4">Limited edition gifts!</p>
          
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="w-4 h-4 text-yellow-300" />
            <span className="text-yellow-300 text-sm font-medium">Ends in:</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            {[
              { v: countdown.days, l: 'Days' },
              { v: countdown.hours, l: 'Hrs' },
              { v: countdown.minutes, l: 'Min' },
              { v: countdown.seconds, l: 'Sec' },
            ].map((t, i) => (
              <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px]">
                <div className="text-xl font-bold text-white">{String(t.v).padStart(2, '0')}</div>
                <div className="text-[10px] text-white/70">{t.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gifts Grid - small cards without names */}
      <div className="px-4 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Festive Collection</h3>
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">{gifts.length} gifts</Badge>
        </div>

        {gifts.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No Christmas gifts available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {gifts.map((gift, i) => {
              const pricing = getPrice(gift.id);
              return (
                <SeasonalGiftCard
                  key={gift.id}
                  gift={gift}
                  price={pricing?.currentPrice ?? gift.base_xp_cost}
                  onClick={() => setSelectedGift(gift)}
                  index={i}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Gift Detail Sheet */}
      <SeasonalGiftDetailSheet
        gift={selectedGift}
        open={!!selectedGift}
        onOpenChange={(open) => !open && setSelectedGift(null)}
        currentPrice={selectedGift ? (getPrice(selectedGift.id)?.currentPrice ?? selectedGift.base_xp_cost) : 0}
        totalSent={selectedGift ? (getPrice(selectedGift.id)?.totalSent ?? 0) : 0}
        priceMultiplier={selectedGift ? (getPrice(selectedGift.id)?.priceMultiplier ?? 1) : 1}
      />
    </div>
  );
};

export default ChristmasGifts;
