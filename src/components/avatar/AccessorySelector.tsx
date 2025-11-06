import React from 'react';
import { AccessoryType } from '@/types/avatar';
import { Crown, Glasses, Wind, Shield, Award, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnlockedAccessories } from '@/hooks/useUnlockedAccessories';
import { cn } from '@/lib/utils';

interface AccessorySelectorProps {
  selectedAccessories: AccessoryType[];
  onToggle: (accessory: AccessoryType) => void;
}

const ACCESSORIES: { type: AccessoryType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    type: 'crown', 
    label: 'Crown', 
    icon: <Crown className="h-5 w-5" />,
    description: 'Royal headwear'
  },
  { 
    type: 'hat', 
    label: 'Hat', 
    icon: <Shield className="h-5 w-5" />,
    description: 'Classic top hat'
  },
  { 
    type: 'glasses', 
    label: 'Glasses', 
    icon: <Glasses className="h-5 w-5" />,
    description: 'Smart eyewear'
  },
  { 
    type: 'scarf', 
    label: 'Scarf', 
    icon: <Wind className="h-5 w-5" />,
    description: 'Cozy neck wrap'
  },
  { 
    type: 'mask', 
    label: 'Mask', 
    icon: <Shield className="h-5 w-5" />,
    description: 'Mysterious look'
  },
  { 
    type: 'badge', 
    label: 'Badge', 
    icon: <Award className="h-5 w-5" />,
    description: 'Achievement pin'
  },
];

export const AccessorySelector: React.FC<AccessorySelectorProps> = ({
  selectedAccessories,
  onToggle,
}) => {
  const { isAccessoryUnlocked, getRequiredXP, userXP } = useUnlockedAccessories();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ACCESSORIES.map((accessory) => {
        const isSelected = selectedAccessories.includes(accessory.type);
        const isUnlocked = isAccessoryUnlocked(accessory.type);
        const requiredXP = getRequiredXP(accessory.type);
        const xpNeeded = requiredXP - userXP;
        
        return (
          <Button
            key={accessory.type}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => isUnlocked && onToggle(accessory.type)}
            disabled={!isUnlocked}
            className={cn(
              "h-auto py-4 flex flex-col items-center gap-2 relative",
              !isUnlocked && "opacity-60 cursor-not-allowed"
            )}
          >
            {!isUnlocked && (
              <div className="absolute top-2 right-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {accessory.icon}
            <div className="text-xs font-medium">{accessory.label}</div>
            {!isUnlocked ? (
              <div className="text-[10px] opacity-70">
                Requires {requiredXP} XP
                {xpNeeded > 0 && <div>({xpNeeded} more needed)</div>}
              </div>
            ) : (
              <div className="text-[10px] opacity-70">{accessory.description}</div>
            )}
          </Button>
        );
      })}
    </div>
  );
};
