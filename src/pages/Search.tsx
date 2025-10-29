import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, User, CheckCircle2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  display_name: string;
  handle: string;
  bio: string | null;
  is_verified: boolean;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, handle, bio, is_verified')
      .or(`display_name.ilike.%${query}%,handle.ilike.%${query}%`)
      .limit(20);
    
    if (data) {
      setResults(data as SearchResult[]);
    }
    setLoading(false);
  };

  const handleStartChat = async (userId: string) => {
    // Create or find existing 1-1 chat
    const { data: existingChats } = await supabase
      .from('chat_members')
      .select('chat_id, chats(is_group)')
      .eq('user_id', userId);

    // Find if there's already a 1-1 chat
    let chatId = null;
    if (existingChats) {
      for (const chat of existingChats) {
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chat.chat_id);
        
        if (members && members.length === 2) {
          chatId = chat.chat_id;
          break;
        }
      }
    }

    if (!chatId) {
      // Create new 1-1 chat
      const { data: newChat } = await supabase
        .from('chats')
        .insert({ is_group: false, created_by: (await supabase.auth.getUser()).data.user?.id })
        .select()
        .single();
      
      if (newChat) {
        chatId = newChat.id;
        await supabase.from('chat_members').insert([
          { chat_id: chatId, user_id: (await supabase.auth.getUser()).data.user?.id },
          { chat_id: chatId, user_id: userId }
        ]);
      }
    }

    if (chatId) {
      navigate(`/chat/${chatId}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-card shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-foreground mb-4">Search</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <SearchIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Searching...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {query ? 'No users found' : 'Search for users by name or handle'}
          </div>
        ) : (
          results.map((user) => (
            <Card key={user.id} className="p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {user.display_name}
                      </h3>
                      {user.is_verified && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.handle}</p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground truncate mt-1">{user.bio}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleStartChat(user.id)}
                  className="ml-2"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Search;
