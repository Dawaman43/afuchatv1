import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { SendGiftDialog } from '@/components/gifts/SendGiftDialog';
import { GiftImage } from '@/components/gifts/GiftImage';
import { useAllGiftPricing } from '@/hooks/useGiftPricing';
import { Snowflake, Gift, Clock, Sparkles, TreePine } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChristmasGift {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  rarity: string;
  base_xp_cost: number;
  image_url: string | null;
  available_until: string | null;
}

const ChristmasGifts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<ChristmasGift[]>([]);
  const [loading, setLoading] = useState(true);
  const { getPrice, loading: pricingLoading } = useAllGiftPricing();

  // Countdown to Christmas end (January 6)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchChristmasGifts();
  }, []);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      let endDate: Date;
      
      // If we're in December, end date is Jan 6 next year
      // If we're in January (1-6), end date is Jan 6 this year
      if (now.getMonth() === 11) {
        endDate = new Date(now.getFullYear() + 1, 0, 7, 0, 0, 0); // Jan 7 midnight
      } else {
        endDate = new Date(now.getFullYear(), 0, 7, 0, 0, 0); // Jan 7 midnight
      }

      const diff = endDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchChristmasGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .or('season.eq.christmas,season.eq.winter,name.ilike.%christmas%,name.ilike.%xmas%,name.ilike.%snow%,name.ilike.%santa%,name.ilike.%reindeer%')
        .order('rarity', { ascending: false });

      if (!error && data) {
        setGifts(data);
      }
    } catch (error) {
      console.error('Error fetching Christmas gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGiftPrice = (gift: ChristmasGift) => {
    const pricing = getPrice(gift.id);
    return pricing?.currentPrice ?? gift.base_xp_cost;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'uncommon': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Falling snowflakes animation
  const snowflakes = useMemo(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
      size: 8 + Math.random() * 12,
    })), []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader size="lg" text="Loading Christmas magic..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      <SEO 
        title="Christmas Limited Edition Gifts | AfuChat"
        description="Discover exclusive Christmas and Winter themed gifts. Limited time only - send festive gifts to your friends and loved ones."
      />
      
      {/* Falling snowflakes background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {snowflakes.map((flake) => (
          <motion.div
            key={flake.id}
            className="absolute text-white/20"
            style={{ left: `${flake.left}%`, top: -20 }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.sin(flake.id) * 30],
              rotate: [0, 360],
            }}
            transition={{
              duration: flake.duration,
              delay: flake.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Snowflake size={flake.size} />
          </motion.div>
        ))}
      </div>

      <PageHeader title="Christmas Gifts" />

      {/* Hero Banner */}
      <div className="relative mx-4 mt-4 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-green-800 p-6">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 text-4xl">🎄</div>
          <div className="absolute top-4 right-4 text-4xl">🎅</div>
          <div className="absolute bottom-4 left-1/4 text-3xl">❄️</div>
          <div className="absolute bottom-4 right-1/4 text-3xl">🎁</div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TreePine className="w-6 h-6 text-green-300" />
            <h2 className="text-2xl font-bold text-white">Christmas Special</h2>
            <TreePine className="w-6 h-6 text-green-300" />
          </div>
          <p className="text-white/80 text-sm mb-4">Limited edition gifts available only during the festive season!</p>
          
          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="w-4 h-4 text-yellow-300" />
            <span className="text-yellow-300 text-sm font-medium">Time Remaining:</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold text-white">{countdown.days}</div>
              <div className="text-[10px] text-white/70 uppercase">Days</div>
            </div>
            <span className="text-white text-2xl font-bold">:</span>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</div>
              <div className="text-[10px] text-white/70 uppercase">Hours</div>
            </div>
            <span className="text-white text-2xl font-bold">:</span>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</div>
              <div className="text-[10px] text-white/70 uppercase">Mins</div>
            </div>
            <span className="text-white text-2xl font-bold">:</span>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold text-white">{countdown.seconds.toString().padStart(2, '0')}</div>
              <div className="text-[10px] text-white/70 uppercase">Secs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gifts Grid */}
      <div className="px-4 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-foreground">Festive Collection</h3>
          <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
            {gifts.length} gifts
          </Badge>
        </div>

        {gifts.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No Christmas gifts available at the moment.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Check back during the festive season!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {gifts.map((gift, index) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="p-3 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => navigate(`/gifts/${gift.id}`)}
                >
                  <div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-red-900/20 to-green-900/20 flex items-center justify-center">
                    <GiftImage
                      giftId={gift.id}
                      giftName={gift.name}
                      emoji={gift.emoji}
                      rarity={gift.rarity}
                      size="lg"
                      className="group-hover:scale-110 transition-transform"
                    />
                    
                    {/* Rarity Badge */}
                    <Badge 
                      className={`absolute top-1 right-1 text-[10px] px-1.5 py-0.5 ${getRarityColor(gift.rarity)}`}
                    >
                      {gift.rarity}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-sm text-foreground truncate">{gift.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-primary font-medium">
                      {getGiftPrice(gift)} Nexa
                    </span>
                    {user && (
                      <SendGiftDialog 
                        receiverId={user.id}
                        receiverName="Select User"
                        trigger={
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Gift className="w-3 h-3 mr-1" />
                            Send
                          </Button>
                        }
                      />
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChristmasGifts;
