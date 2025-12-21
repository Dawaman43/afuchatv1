import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface SeasonalGiftCardProps {
  gift: {
    id: string;
    name: string;
    emoji: string;
    rarity: string;
    image_url?: string | null;
  };
  price: number;
  onClick: () => void;
  index?: number;
}

const getRarityGradient = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 'from-amber-500/30 via-yellow-400/20 to-amber-600/30';
    case 'epic':
      return 'from-purple-500/30 via-violet-400/20 to-purple-600/30';
    case 'rare':
      return 'from-blue-500/30 via-cyan-400/20 to-blue-600/30';
    case 'uncommon':
      return 'from-green-500/30 via-emerald-400/20 to-green-600/30';
    default:
      return 'from-muted/50 via-muted/30 to-muted/50';
  }
};

const getRarityBorder = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 'border-amber-500/50 hover:border-amber-400';
    case 'epic':
      return 'border-purple-500/50 hover:border-purple-400';
    case 'rare':
      return 'border-blue-500/50 hover:border-blue-400';
    case 'uncommon':
      return 'border-green-500/50 hover:border-green-400';
    default:
      return 'border-border/50 hover:border-border';
  }
};

const getRarityShadow = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 'shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    case 'epic':
      return 'shadow-[0_0_20px_rgba(168,85,247,0.3)]';
    case 'rare':
      return 'shadow-[0_0_15px_rgba(59,130,246,0.3)]';
    case 'uncommon':
      return 'shadow-[0_0_15px_rgba(34,197,94,0.2)]';
    default:
      return '';
  }
};

export const SeasonalGiftCard = ({ gift, price, onClick, index = 0 }: SeasonalGiftCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-2xl p-3
        bg-gradient-to-br ${getRarityGradient(gift.rarity)}
        border ${getRarityBorder(gift.rarity)}
        ${getRarityShadow(gift.rarity)}
        backdrop-blur-sm transition-all duration-300
        group overflow-hidden
      `}
    >
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Gift image/emoji container */}
      <div className="relative aspect-square flex items-center justify-center mb-2 rounded-xl bg-background/30 overflow-hidden">
        {gift.image_url ? (
          <img 
            src={gift.image_url} 
            alt={gift.name}
            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl group-hover:scale-125 transition-transform duration-300">
            {gift.emoji}
          </span>
        )}
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Price - no name shown */}
      <div className="flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">
          {price.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground ml-1">Nexa</span>
      </div>
    </motion.div>
  );
};
