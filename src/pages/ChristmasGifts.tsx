import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { SeasonalGiftCard } from '@/components/gifts/SeasonalGiftCard';
import { SeasonalGiftDetailSheet } from '@/components/gifts/SeasonalGiftDetailSheet';
import { useAllGiftPricing } from '@/hooks/useGiftPricing';
import { Snowflake, Gift, Clock, Sparkles, TreePine, Star, Coins, Flame, Trophy, Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// Import real Christmas images
import santaClaus from '@/assets/christmas/santa-claus.png';
import christmasTree from '@/assets/christmas/christmas-tree.png';
import giftBoxImg from '@/assets/gifts/christmas-gift-box.png';
import goldenOrnament from '@/assets/gifts/golden-ornament.png';
import reindeerPlush from '@/assets/gifts/reindeer-plush.png';
import snowflakeOrnament from '@/assets/gifts/snowflake-ornament.png';
import candyCaneTreat from '@/assets/gifts/candy-cane-treat.png';
import santaHat from '@/assets/gifts/santa-hat.png';

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

// Featured gift images mapping
const featuredGiftImages = [
  { img: giftBoxImg, name: 'Gift Box', price: 500 },
  { img: goldenOrnament, name: 'Golden Ornament', price: 750 },
  { img: reindeerPlush, name: 'Reindeer Plush', price: 1200 },
  { img: snowflakeOrnament, name: 'Crystal Snowflake', price: 850 },
  { img: candyCaneTreat, name: 'Candy Cane', price: 300 },
  { img: santaHat, name: 'Santa Hat', price: 650 },
];

const ChristmasGifts = () => {
  const [gifts, setGifts] = useState<ChristmasGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<ChristmasGift | null>(null);
  const { getPrice } = useAllGiftPricing();
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
    Array.from({ length: 30 }).map((_, i) => ({
      id: i, 
      left: Math.random() * 100, 
      delay: Math.random() * 8, 
      duration: 10 + Math.random() * 10, 
      size: 12 + Math.random() * 20,
    })), []);

  const christmasLights = useMemo(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      color: ['bg-red-500', 'bg-green-500', 'bg-yellow-400', 'bg-blue-500', 'bg-pink-500'][i % 5],
      delay: i * 0.1,
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
            className="absolute text-white/40" 
            style={{ left: `${f.left}%`, top: -30 }}
            animate={{ y: ['0vh', '110vh'], rotate: [0, 360], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'linear' }}
          >
            <Snowflake size={f.size} />
          </motion.div>
        ))}
      </div>

      {/* Christmas lights string at top */}
      <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="relative h-8 bg-gradient-to-b from-black/20 to-transparent">
          <svg className="absolute top-0 left-0 w-full h-4" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,5 Q5,8 10,5 Q15,2 20,5 Q25,8 30,5 Q35,2 40,5 Q45,8 50,5 Q55,2 60,5 Q65,8 70,5 Q75,2 80,5 Q85,8 90,5 Q95,2 100,5" 
                  stroke="#333" strokeWidth="0.5" fill="none" />
          </svg>
          <div className="flex justify-around px-2 pt-3">
            {christmasLights.map((light) => (
              <motion.div
                key={light.id}
                className={`w-3 h-4 rounded-full ${light.color}`}
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{ 
                  duration: 1.2, 
                  delay: light.delay, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{ 
                  boxShadow: '0 0 8px currentColor, 0 0 16px currentColor, 0 4px 8px rgba(0,0,0,0.3)',
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Santa decoration - fixed position */}
      <motion.img
        src={santaClaus}
        alt="Santa Claus"
        className="fixed bottom-24 right-2 w-24 h-24 z-10 drop-shadow-2xl pointer-events-none"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      />

      {/* Christmas tree decoration - fixed position */}
      <motion.img
        src={christmasTree}
        alt="Christmas Tree"
        className="fixed bottom-24 left-2 w-20 h-28 z-10 drop-shadow-2xl pointer-events-none opacity-80"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 0.8 }}
        transition={{ delay: 1.2, type: 'spring' }}
      />

      <div className="pt-8">
        <PageHeader title="Christmas Gifts" />
      </div>

      {/* Hero Banner with Santa */}
      <div className="relative mx-4 mt-4 mb-6 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-green-800" />
        
        {/* Decorative corner images */}
        <img src={giftBoxImg} alt="" className="absolute -bottom-4 -left-4 w-20 h-20 opacity-30 rotate-[-15deg]" />
        <img src={goldenOrnament} alt="" className="absolute -top-4 -right-4 w-16 h-16 opacity-30" />

        <div className="relative z-10 p-6 text-center">
          <motion.div 
            className="flex items-center justify-center gap-3 mb-3"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <img src={christmasTree} alt="" className="w-8 h-10" />
            <h2 className="text-2xl font-bold text-white">Christmas Special</h2>
            <img src={christmasTree} alt="" className="w-8 h-10" />
          </motion.div>
          
          <motion.p 
            className="text-white/90 text-sm mb-4 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ✨ Exclusive ACoin Gifts - Limited Time Only! ✨
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-yellow-300" />
              <span className="text-yellow-300 text-sm font-semibold">Sale ends in:</span>
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
                  className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[55px] border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  animate={{ scale: i === 3 ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1, repeat: i === 3 ? Infinity : 0 }}
                >
                  <div className="text-2xl font-bold text-white tabular-nums">{String(t.v).padStart(2, '0')}</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">{t.l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="mt-4 inline-flex items-center gap-2 bg-yellow-500/30 backdrop-blur-sm rounded-full px-5 py-2.5 border border-yellow-500/40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-200 font-bold">Pay with ACoin</span>
          </motion.div>
        </div>
      </div>

      {/* Featured Gifts Showcase - Real Images */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold">Featured Gifts</h3>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">HOT</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {featuredGiftImages.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-3"
            >
              <motion.img 
                src={item.img} 
                alt={item.name}
                className="w-full aspect-square object-contain mb-2"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring' }}
              />
              <div className="text-center">
                <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-500">{item.price}</span>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500/80 text-white text-[10px] px-1.5 py-0.5">-20%</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Gift, value: '150+', label: 'Gifts', color: 'text-red-400' },
            { icon: Users, value: '5.2K', label: 'Buyers', color: 'text-green-400' },
            { icon: Heart, value: '12K', label: 'Sent', color: 'text-pink-400' },
            { icon: Trophy, value: '#1', label: 'Rated', color: 'text-yellow-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 text-center border border-white/10"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Premium Collection Banner */}
      <motion.div 
        className="mx-4 mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <motion.img 
            src={goldenOrnament} 
            alt="Premium" 
            className="w-16 h-16"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="flex-1">
            <h4 className="font-bold text-amber-400 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400" />
              Premium Collection
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Exclusive legendary gifts with rare designs
            </p>
          </div>
          <Badge className="bg-amber-500 text-black font-bold">VIP</Badge>
        </div>
      </motion.div>

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
            {gifts.length} gifts
          </Badge>
        </motion.div>

        {gifts.length === 0 ? (
          <motion.div 
            className="text-center py-16 rounded-2xl bg-gradient-to-br from-red-500/10 to-green-500/10 border border-red-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <img src={giftBoxImg} alt="" className="w-24 h-24 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No Christmas gifts available yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Check back soon!</p>
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
      </div>

      {/* Special Offers Section */}
      <div className="px-4 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="text-lg font-bold">Special Offers</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
            <img src={reindeerPlush} alt="Bundle" className="w-12 h-12 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-center">Holiday Bundle</h4>
            <p className="text-[10px] text-muted-foreground text-center mt-1">3 gifts + bonus</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-xs line-through text-muted-foreground">2000</span>
              <span className="text-sm font-bold text-green-400">1500 ACoin</span>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
            <img src={candyCaneTreat} alt="Daily" className="w-12 h-12 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-center">Daily Deal</h4>
            <p className="text-[10px] text-muted-foreground text-center mt-1">Changes every 24h</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-xs line-through text-muted-foreground">500</span>
              <span className="text-sm font-bold text-green-400">250 ACoin</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Santa greeting */}
      <motion.div 
        className="mx-4 mt-8 p-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-green-500/20 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-4">
          <img src={santaClaus} alt="Santa" className="w-16 h-16" />
          <div className="flex-1">
            <p className="font-bold text-sm">Ho Ho Ho! Merry Christmas!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Spread joy with exclusive holiday gifts. Limited time offers await!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer decorations */}
      <motion.div 
        className="mt-8 text-center pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={giftBoxImg} alt="" className="w-8 h-8 opacity-60" />
          <img src={snowflakeOrnament} alt="" className="w-7 h-7 opacity-60" />
          <img src={santaHat} alt="" className="w-8 h-8 opacity-60" />
          <img src={goldenOrnament} alt="" className="w-7 h-7 opacity-60" />
          <img src={candyCaneTreat} alt="" className="w-8 h-8 opacity-60" />
        </div>
        <p className="text-xs text-muted-foreground">
          🎄 Spread holiday cheer with exclusive gifts! 🎄
        </p>
      </motion.div>

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