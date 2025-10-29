import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Users, User, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
  last_message_content?: string;
  last_message_sender_id?: string;
  unread_count?: number;
  other_member?: {
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}h`;
  
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' });
};

const Chats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch chat members for this user
      const { data: chatMembers, error: membersError } = await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chats (
            id,
            name,
            is_group,
            created_at,
            updated_at,
            chat_members (
              user_id,
              profiles (
                display_name,
                handle,
                avatar_url
              )
            )
          ),
          messages (
            id,
            encrypted_content,
            sent_at,
            sender_id,
            message_status (
              read_at
            )
          ) !inner order(sent_at desc) limit(1)
        `)
        .eq('user_id', user.id)
        .order('chats.updated_at', { ascending: false, referencedTable: 'chats' });

      if (membersError) throw membersError;

      const enrichedChats: Chat[] = chatMembers?.map((member: any) => {
        const chat = member.chats;
        const otherMembers = chat.chat_members.filter((m: any) => m.user_id !== user.id);
        const otherMember = otherMembers.length > 0 ? otherMembers[0].profiles : null;
        const lastMessage = member.messages?.[0];

        // Calculate unread count: messages where read_at is null for this user
        const unreadCount = member.messages?.filter((msg: any) => 
          !msg.message_status?.some((status: any) => status.user_id === user.id && status.read_at)
        ).length || 0;

        let lastMessageContent = '';
        if (lastMessage) {
          // In production, decrypt encrypted_content here
          lastMessageContent = lastMessage.encrypted_content.substring(0, 50) + (lastMessage.encrypted_content.length > 50 ? '...' : '');
        } else if (chat.is_group) {
          lastMessageContent = 'No messages yet';
        } else {
          lastMessageContent = `Say hi to ${otherMember?.display_name || 'someone'}`;
        }

        return {
          ...chat,
          other_member: otherMember,
          last_message_content: lastMessageContent,
          last_message_sender_id: lastMessage?.sender_id,
          unread_count: unreadCount > 99 ? '99+' : unreadCount,
        };
      }) || [];

      setChats(enrichedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();

    if (!user) return;

    // Realtime subscription for new messages in user's chats
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_members.user_id=eq.${user.id}`, // Only user's chats
        },
        (payload) => {
          // Update last message and unread on new message
          fetchChats(); // Refetch for simplicity; optimize with direct state update if needed
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_status',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Update unread on status change
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchChats]);

  const handleNewChat = () => {
    if (!user) {
      toast.info('Sign in to start a new chat!', {
        action: { label: 'Sign In', onClick: () => navigate('/auth') },
      });
      return;
    }
    // Navigate to new chat creation or open modal
    navigate('/new-chat'); // Assuming a route for new chat
  };

  const ChatItemSkeleton = () => (
    <div className="flex items-center space-x-4 p-4 rounded-xl bg-card shadow-md animate-pulse">
      <Skeleton className="h-10 w-10 rounded-full" /> 
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="h-4 w-10" />
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-4 p-4">
        {[...Array(5)].map((_, i) => <ChatItemSkeleton key={i} />)}
      </div>
    );
  }

  const ChatCard = ({ chat }: { chat: Chat }) => {
    const chatName = chat.name || (chat.is_group ? 'Group Chat' : chat.other_member?.display_name || 'Direct Message');
    const Icon = chat.is_group ? Users : User;
    const timeDisplay = formatTime(chat.updated_at);
    const lastMessagePreview = chat.last_message_content || (chat.is_group ? 'No messages yet' : `Say hi to ${chat.other_member?.display_name || 'someone'}`);
    const hasUnread = (chat.unread_count as number) > 0;

    const handleChatClick = () => {
      if (!user) {
        toast.info('Sign in to open chat!', {
          action: { label: 'Sign In', onClick: () => navigate('/auth') },
        });
        return;
      }
      navigate(`/chat/${chat.id}`);
    };

    return (
      <Card
        className="p-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-muted/30 cursor-pointer transition-all duration-200"
        onClick={handleChatClick}
      >
        <div className="flex items-center space-x-4">
          {/* Avatar/Indicator */}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground shadow-sm overflow-hidden ${
            chat.is_group ? 'bg-indigo-500' : 'bg-primary'
          }`}>
            {chat.other_member?.avatar_url ? (
              <img src={chat.other_member.avatar_url} alt={chatName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-foreground">{chatName}</h3>
            <p className="text-sm text-muted-foreground truncate">{lastMessagePreview}</p>
          </div>

          <div className="flex flex-col items-end space-y-1 min-w-[60px]">
            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeDisplay}
            </span>
            {hasUnread && (
              <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                {chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-card shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-foreground">Conversations</h1>
        <Button 
          size="icon" 
          variant="default" 
          className="rounded-full shadow-md"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No conversations found.</p>
            <p className="text-sm text-muted-foreground">
              {!user ? 'Sign in to start chatting!' : 'Tap the plus button to start a new chat!'}
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} />
          ))
        )}
      </div>
    </div>
  );
};

export default Chats;
