import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Users, Search } from 'lucide-react';

interface ChallengeDialogProps {
  gameType: string;
  difficulty: string;
}

const ChallengeDialog = ({ gameType, difficulty }: ChallengeDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (!search.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url')
        .or(`display_name.ilike.%${search}%,handle.ilike.%${search}%`)
        .neq('id', user?.id)
        .limit(5);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const sendChallenge = async (opponentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('game_challenges')
        .insert({
          challenger_id: user.id,
          opponent_id: opponentId,
          game_type: gameType,
          difficulty: difficulty,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Challenge sent!');
      setOpen(false);
      setSearch('');
      setUsers([]);
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.error('Failed to send challenge');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Challenge Friend
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Challenge a Friend</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or @handle"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{u.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{u.handle}</p>
                </div>
                <Button size="sm" onClick={() => sendChallenge(u.id)}>
                  Challenge
                </Button>
              </div>
            ))}
          </div>

          {search && users.length === 0 && !loading && (
            <p className="text-center text-muted-foreground">No users found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeDialog;
