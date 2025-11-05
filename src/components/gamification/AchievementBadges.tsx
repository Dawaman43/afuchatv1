import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Users, UserCheck, Sparkles, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Achievement {
  id: string;
  achievement_type: string;
  earned_at: string;
  metadata: any;
}

const ACHIEVEMENT_CONFIG: Record<string, {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}> = {
  'profile_completed': {
    icon: <UserCheck className="h-5 w-5" />,
    label: 'Profile Master',
    description: 'Completed your profile',
    color: 'bg-blue-500',
  },
  '7_day_streak': {
    icon: <Flame className="h-5 w-5" />,
    label: '7-Day Streak',
    description: 'Logged in for 7 consecutive days',
    color: 'bg-orange-500',
  },
  '30_day_streak': {
    icon: <Flame className="h-5 w-5" />,
    label: '30-Day Legend',
    description: 'Logged in for 30 consecutive days!',
    color: 'bg-red-500',
  },
  '5_referrals': {
    icon: <Users className="h-5 w-5" />,
    label: 'Social Butterfly',
    description: 'Invited 5 friends',
    color: 'bg-purple-500',
  },
  'first_post': {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'First Steps',
    description: 'Created your first post',
    color: 'bg-green-500',
  },
};

interface AchievementBadgesProps {
  userId: string;
}

export const AchievementBadges = ({ userId }: AchievementBadgesProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });

        if (error) throw error;
        setAchievements(data || []);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No achievements yet. Keep engaging to unlock badges!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {achievements.map((achievement) => {
        const config = ACHIEVEMENT_CONFIG[achievement.achievement_type] || {
          icon: <Target className="h-5 w-5" />,
          label: achievement.achievement_type,
          description: 'Achievement unlocked',
          color: 'bg-gray-500',
        };

        return (
          <Card
            key={achievement.id}
            className="p-4 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
          >
            <div className={`${config.color} p-3 rounded-full text-white mb-2`}>
              {config.icon}
            </div>
            <h4 className="font-semibold text-sm">{config.label}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {config.description}
            </p>
            <Badge variant="outline" className="mt-2 text-xs">
              {new Date(achievement.earned_at).toLocaleDateString()}
            </Badge>
          </Card>
        );
      })}
    </div>
  );
};
