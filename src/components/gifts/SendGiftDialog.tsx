import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SimpleGiftIcon } from './SimpleGiftIcon';
import { GiftConfetti } from './GiftConfetti';
import { ComboConfetti } from './ComboConfetti';

interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  base_xp_cost: number;
  rarity: string;
  description: string;
  season?: string;
  available_from?: string;
  available_until?: string;
}

interface GiftStatistics {
  price_multiplier: number;
  total_sent: number;
}

interface SendGiftDialogProps {
  receiverId: string;
  receiverName: string;
  trigger?: React.ReactNode;
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
};

const seasonColors: Record<string, string> = {
  Valentine: 'bg-pink-500',
  Halloween: 'bg-orange-500',
  Christmas: 'bg-red-500',
};

const seasonEmojis: Record<string, string> = {
  Valentine: '💝',
  Halloween: '🎃',
  Christmas: '🎄',
};

export const SendGiftDialog = ({ receiverId, receiverName, trigger }: SendGiftDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [giftStats, setGiftStats] = useState<Record<string, GiftStatistics>>({});
  const [selectedGifts, setSelectedGifts] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showComboConfetti, setShowComboConfetti] = useState(false);
  const [sentGiftEmojis, setSentGiftEmojis] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchGifts();
      fetchUserXP();
    }
  }, [open]);

  const fetchGifts = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: giftsData } = await supabase
      .from('gifts')
      .select('*')
      .or(`available_from.is.null,and(available_from.lte.${today},available_until.gte.${today})`)
      .order('base_xp_cost', { ascending: true });

    const { data: statsData } = await supabase
      .from('gift_statistics')
      .select('gift_id, price_multiplier, total_sent');

    if (giftsData) {
      setGifts(giftsData);
    }

    if (statsData) {
      const statsMap: Record<string, GiftStatistics> = {};
      statsData.forEach((stat: any) => {
        statsMap[stat.gift_id] = {
          price_multiplier: parseFloat(stat.price_multiplier),
          total_sent: stat.total_sent,
        };
      });
      setGiftStats(statsMap);
    }
  };

  const fetchUserXP = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .single();

    if (data) {
      setUserXP(data.xp);
    }
  };

  const calculatePrice = (giftId: string, baseCost: number) => {
    const stats = giftStats[giftId];
    if (!stats) return baseCost;
    return Math.ceil(baseCost * stats.price_multiplier);
  };

  const toggleGiftSelection = (giftId: string, canAfford: boolean) => {
    if (!canAfford) return;
    
    setSelectedGifts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(giftId)) {
        newSet.delete(giftId);
      } else {
        newSet.add(giftId);
      }
      return newSet;
    });
  };

  const calculateComboDiscount = (giftCount: number) => {
    if (giftCount >= 6) return 0.15;
    if (giftCount >= 4) return 0.10;
    if (giftCount >= 2) return 0.05;
    return 0;
  };

  const calculateTotalCost = () => {
    let total = 0;
    selectedGifts.forEach(giftId => {
      const gift = gifts.find(g => g.id === giftId);
      if (gift) {
        total += calculatePrice(gift.id, gift.base_xp_cost);
      }
    });
    return total;
  };

  const getDiscountedCost = () => {
    const total = calculateTotalCost();
    const discount = calculateComboDiscount(selectedGifts.size);
    return Math.ceil(total * (1 - discount));
  };

  const handleSendGift = async () => {
    if (selectedGifts.size === 0 || !user) return;

    setLoading(true);
    try {
      const giftIds = Array.from(selectedGifts);
      const giftEmojis = giftIds.map(id => gifts.find(g => g.id === id)?.emoji || '🎁');

      // Use combo function if multiple gifts, otherwise single gift
      if (giftIds.length > 1) {
        const { data, error } = await supabase.rpc('send_gift_combo', {
          p_gift_ids: giftIds,
          p_receiver_id: receiverId,
          p_message: message.trim() || null,
        });

        if (error) throw error;

        const result = data as {
          success: boolean;
          message: string;
          gift_count?: number;
          original_cost?: number;
          discounted_cost?: number;
          discount_percent?: number;
          new_xp?: number;
          new_grade?: string;
        };

        if (result.success) {
          setSentGiftEmojis(giftEmojis);
          setShowComboConfetti(true);
          
          const savedXP = (result.original_cost || 0) - (result.discounted_cost || 0);
          toast.success(
            t('gifts.comboSent', { saved: savedXP }),
            { description: result.new_grade ? `${t('gamification.grade')}: ${result.new_grade}` : undefined }
          );
          setOpen(false);
          setSelectedGifts(new Set());
          setMessage('');
          fetchUserXP();
          
          window.dispatchEvent(new CustomEvent('xp-updated', { 
            detail: { xp: result.new_xp, grade: result.new_grade } 
          }));
        } else {
          toast.error(result.message);
        }
      } else {
        // Single gift
        const { data, error } = await supabase.rpc('send_gift', {
          p_gift_id: giftIds[0],
          p_receiver_id: receiverId,
          p_message: message.trim() || null,
        });

        if (error) throw error;

        const result = data as { 
          success: boolean; 
          message: string; 
          xp_cost?: number;
          new_xp?: number;
          new_grade?: string;
        };

        if (result.success) {
          setSentGiftEmojis([giftEmojis[0]]);
          setShowConfetti(true);
          
          toast.success(
            t('gifts.giftSent'),
            { description: result.new_grade ? `${t('gamification.grade')}: ${result.new_grade}` : undefined }
          );
          setOpen(false);
          setSelectedGifts(new Set());
          setMessage('');
          fetchUserXP();
          
          window.dispatchEvent(new CustomEvent('xp-updated', { 
            detail: { xp: result.new_xp, grade: result.new_grade } 
          }));
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      toast.error(t('gifts.giftFailed'));
    } finally {
      setLoading(false);
    }
  };

  const totalCost = calculateTotalCost();
  const discountedCost = getDiscountedCost();
  const discount = calculateComboDiscount(selectedGifts.size);
  const savedXP = totalCost - discountedCost;

  return (
    <>
      {showConfetti && (
        <GiftConfetti 
          emoji={sentGiftEmojis[0]} 
          onComplete={() => setShowConfetti(false)} 
        />
      )}
      
      {showComboConfetti && (
        <ComboConfetti 
          emojis={sentGiftEmojis}
          giftCount={selectedGifts.size}
          onComplete={() => setShowComboConfetti(false)} 
        />
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <Gift className="h-4 w-4" />
              {t('gifts.sendGift')}
            </Button>
          )}
        </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('gifts.sendGiftTo', { name: receiverName })}</DialogTitle>
          <DialogDescription className="space-y-1">
            <div>{t('gifts.yourXP', { xp: userXP })}</div>
            {selectedGifts.size > 1 && (
              <div className="text-primary font-semibold">
                {t('gifts.comboDiscount', { percent: (discount * 100).toFixed(0) })}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          {t('gifts.selectMultiple')}
        </div>

        <div className="grid grid-cols-2 gap-4 my-6">
          {gifts.map((gift) => {
            const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
            const stats = giftStats[gift.id];
            const canAfford = selectedGifts.size === 0 ? userXP >= currentPrice : userXP >= discountedCost;
            const isSelected = selectedGifts.has(gift.id);

            return (
              <div
                key={gift.id}
                onClick={() => toggleGiftSelection(gift.id, canAfford)}
                className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-primary shadow-2xl shadow-primary/20 scale-105 bg-primary/5'
                    : canAfford
                    ? 'hover:shadow-xl hover:scale-105 hover:ring-1 hover:ring-primary/30'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 left-2 z-10 bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                {gift.season && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className={`${seasonColors[gift.season]} text-white text-[10px] px-2 py-1 shadow-lg`}>
                      {seasonEmojis[gift.season]} {gift.season}
                    </Badge>
                  </div>
                )}
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <SimpleGiftIcon 
                      emoji={gift.emoji}
                      size={72}
                    />
                  </div>
                  <h4 className="font-bold text-sm">{gift.name}</h4>
                  <p className="text-xs text-muted-foreground min-h-[32px]">
                    {gift.description}
                  </p>
                  <div className="space-y-2">
                    <Badge className={rarityColors[gift.rarity]} variant="secondary">
                      {t(`gifts.${gift.rarity}`)}
                    </Badge>
                    <div className="text-base font-bold text-primary">
                      {currentPrice} {t('gamification.xp')}
                      {stats && stats.price_multiplier > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (×{stats.price_multiplier.toFixed(2)})
                        </span>
                      )}
                    </div>
                    {stats && (
                      <p className="text-xs text-muted-foreground">
                        {t('gifts.sentTimes', { count: stats.total_sent })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedGifts.size > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('gifts.originalCost', { cost: totalCost })}</span>
              {discount > 0 && (
                <div className="space-y-1 text-right">
                  <span className="line-through text-muted-foreground">{totalCost} XP</span>
                  <div className="text-primary font-bold text-lg">{discountedCost} XP</div>
                  <span className="text-xs text-green-500">{t('gifts.savedXP', { amount: savedXP })}</span>
                </div>
              )}
              {discount === 0 && (
                <span className="font-bold">{t('gifts.totalCost', { cost: totalCost })}</span>
              )}
            </div>
            
            <Textarea
              placeholder={t('gifts.addMessage')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSendGift}
              disabled={loading || discountedCost > userXP}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('gifts.sending')}
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  {selectedGifts.size > 1 
                    ? t('gifts.sendCombo', { count: selectedGifts.size })
                    : t('gifts.sendGift')
                  }
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
      </Dialog>
    </>
  );
};
