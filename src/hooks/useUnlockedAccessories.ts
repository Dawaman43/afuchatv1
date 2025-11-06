import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AccessoryType } from '@/types/avatar';
import { toast } from 'sonner';

export const ACCESSORY_XP_REQUIREMENTS: Record<AccessoryType, number> = {
  badge: 100,
  glasses: 250,
  scarf: 500,
  mask: 1000,
  hat: 1500,
  crown: 5000,
};

export const useUnlockedAccessories = () => {
  const { user } = useAuth();
  const [unlockedAccessories, setUnlockedAccessories] = useState<AccessoryType[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnlockedAccessories = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user XP
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserXP(profile.xp);
        }

        // Fetch unlocked accessories
        const { data, error } = await supabase
          .from('unlocked_accessories')
          .select('accessory_type')
          .eq('user_id', user.id);

        if (error) throw error;

        const unlocked = data?.map(item => item.accessory_type as AccessoryType) || [];
        setUnlockedAccessories(unlocked);
      } catch (error) {
        console.error('Error fetching unlocked accessories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnlockedAccessories();
  }, [user]);

  const checkAndUnlockAccessories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_and_unlock_accessories', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as { newly_unlocked: string[]; user_xp: number } | null;

      if (result && result.newly_unlocked && result.newly_unlocked.length > 0) {
        // Update local state
        setUnlockedAccessories(prev => [
          ...prev,
          ...result.newly_unlocked as AccessoryType[],
        ]);
        setUserXP(result.user_xp);

        // Show toast for each newly unlocked accessory
        result.newly_unlocked.forEach(accessory => {
          toast.success(`🎉 New accessory unlocked: ${accessory}!`, {
            description: `You can now use the ${accessory} in your avatar.`,
            duration: 5000,
          });
        });
      }

      return result;
    } catch (error) {
      console.error('Error checking accessories:', error);
    }
  };

  const isAccessoryUnlocked = (accessory: AccessoryType): boolean => {
    return unlockedAccessories.includes(accessory);
  };

  const getRequiredXP = (accessory: AccessoryType): number => {
    return ACCESSORY_XP_REQUIREMENTS[accessory];
  };

  const canUnlockAccessory = (accessory: AccessoryType): boolean => {
    return userXP >= ACCESSORY_XP_REQUIREMENTS[accessory];
  };

  return {
    unlockedAccessories,
    userXP,
    loading,
    checkAndUnlockAccessories,
    isAccessoryUnlocked,
    getRequiredXP,
    canUnlockAccessory,
  };
};
