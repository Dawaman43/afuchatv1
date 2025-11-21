interface GiftImageProps {
  giftId: string;
  giftName: string;
  emoji: string;
  rarity: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GiftImage = ({ 
  emoji, 
  size = 'md',
  className = '' 
}: GiftImageProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-3xl',
    md: 'w-20 h-20 text-5xl',
    lg: 'w-32 h-32 text-7xl',
    xl: 'w-48 h-48 text-9xl'
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={`${sizeClass} ${className} flex items-center justify-center`}>
      <span className="drop-shadow-lg">{emoji}</span>
    </div>
  );
};
