import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  game_type: string;
  difficulty: string;
  status: string;
  created_at: string;
  challenger: {
    display_name: string;
    handle: string;
  };
  opponent: {
    display_name: string;
    handle: string;
  };
}

interface ChallengesListProps {
  onAcceptChallenge?: (challenge: Challenge) => void;
}

const ChallengesList = ({ onAcceptChallenge }: ChallengesListProps) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    if (!user) return;
    loadChallenges();

    const channel = supabase
      .channel('challenges-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_challenges',
          filter: `opponent_id=eq.${user.id}`
        },
        () => loadChallenges()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadChallenges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_challenges')
        .select(`
          *,
          challenger:profiles!game_challenges_challenger_id_fkey(display_name, handle),
          opponent:profiles!game_challenges_opponent_id_fkey(display_name, handle)
        `)
        .eq('opponent_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const handleChallenge = async (challengeId: string, accept: boolean) => {
    try {
      if (accept) {
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge && onAcceptChallenge) {
          onAcceptChallenge(challenge);
        }
        
        const { error } = await supabase
          .from('game_challenges')
          .update({ status: 'active' })
          .eq('id', challengeId);

        if (error) throw error;
        toast.success('Challenge accepted!');
      } else {
        const { error } = await supabase
          .from('game_challenges')
          .update({ status: 'declined' })
          .eq('id', challengeId);

        if (error) throw error;
        toast.success('Challenge declined');
      }

      loadChallenges();
    } catch (error) {
      console.error('Error handling challenge:', error);
      toast.error('Failed to handle challenge');
    }
  };

  if (challenges.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Pending Challenges
      </h3>
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div>
              <p className="font-medium">
                {challenge.challenger.display_name} challenged you!
              </p>
              <p className="text-sm text-muted-foreground">
                {challenge.game_type} - {challenge.difficulty}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleChallenge(challenge.id, true)}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChallenge(challenge.id, false)}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ChallengesList;
