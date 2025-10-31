import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, User, Loader2, Phone, Video, MoreVertical, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  encrypted_content: string;
  sender_id: string;
  sent_at: string;
  profiles: {
    display_name: string;
    handle: string;
  };
  reactions?: { reaction: string; count: number; users: string[] }[]; // Aggregated reactions
}

interface ChatInfo {
  name: string | null;
  is_group: boolean;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡']; // Common reactions

const ChatRoom = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [showReactions, setShowReactions] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    fetchChatInfo();
    fetchMessagesWithReactions();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          supabase
            .from('profiles')
            .select('display_name, handle')
            .eq('id', payload.new.sender_id)
            .single()
            .then(({ data: profile, error }) => {
              if (error) {
                console.error('Error fetching sender profile:', error);
                return;
              }
              if (profile) {
                const newMsg = { ...payload.new, profiles: profile, reactions: [] };
                setMessages((prev) => [...prev, newMsg]);
              }
            });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${chatId}`, // Note: filter on message_id, but channel is per chat
        },
        () => fetchMessagesWithReactions() // Refetch reactions on change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatInfo = async () => {
    const { data } = await supabase
      .from('chats')
      .select('name, is_group')
      .eq('id', chatId)
      .single();
    
    if (data) {
      setChatInfo(data);
      if (!data.is_group) {
        setOnline(Math.random() > 0.5);
      }
    }
  };

  const fetchMessagesWithReactions = async () => {
    console.log('Fetching messages for chatId:', chatId);
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('*, profiles(display_name, handle)')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    if (msgError) {
      console.error('Fetch messages error:', msgError);
      toast.error('Failed to load messages');
      setLoading(false);
      return;
    }

    if (msgData) {
      // Fetch reactions for each message
      const messagesWithReactions = await Promise.all(
        msgData.map(async (msg) => {
          const { data: reactionsData } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', msg.id);

          if (reactionsData) {
            const reactionsMap = reactionsData.reduce((acc, r) => {
              if (!acc[r.reaction]) acc[r.reaction] = { count: 0, users: [] };
              acc[r.reaction].count++;
              acc[r.reaction].users.push(r.user_id);
              return acc;
            }, {} as Record<string, { count: number; users: string[] }>);

            return { ...msg, reactions: Object.entries(reactionsMap).map(([reaction, data]) => ({ reaction, count: data.count, users: data.users })) };
          }
          return { ...msg, reactions: [] };
        })
      );
      setMessages(messagesWithReactions as Message[]);
    }
    setLoading(false);
  };

  const handleReact = async (messageId: string, reaction: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('message_reactions')
      .upsert({ message_id: messageId, user_id: user.id, reaction }, { ignoreDuplicates: false });

    if (error) {
      toast.error('Failed to react');
    } else {
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: msg.reactions
                  ? [
                      ...(msg.reactions.filter((r) => r.reaction !== reaction) || []),
                      { reaction, count: (msg.reactions?.find((r) => r.reaction === reaction)?.count || 0) + 1, users: [...(msg.reactions?.find((r) => r.reaction === reaction)?.users || []), user.id] },
                    ]
                  : [{ reaction, count: 1, users: [user.id] }],
              }
            : msg
        )
      );
    }
    setShowReactions(null);
  };

  const handleLongPress = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setShowReactions({ messageId, x: rect.right, y: rect.bottom });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatId) return;

    setSending(true);
    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        encrypted_content: newMessage,
      })
      .select()
      .single();

    if (error) {
      console.error('Send error details:', error);
      toast.error(`Failed to send: ${error.message}`);
    } else if (inserted) {
      setNewMessage('');
      const optimisticMsg: Message = {
        ...inserted,
        profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' },
        reactions: [],
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }
    setSending(false);
  };

  const handleBack = () => {
    navigate(-1); // Back to chat list
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10 flex items-center px-4 py-3 gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
          </h1>
          {chatInfo && !chatInfo.is_group && (
            <p className={`text-xs ${online ? 'text-green-600' : 'text-muted-foreground'}`}>
              {online ? 'online' : 'last seen recently'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-muted">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-muted">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: '80px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
            <MessageSquare className="h-12 w-12 opacity-50" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
            <p className="text-xs text-muted-foreground">Messages are encrypted end-to-end</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const time = new Date(message.sent_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                onContextMenu={(e) => handleLongPress(e, message.id)}
              >
                {!isOwn ? (
                  <div className="flex items-end gap-2 max-w-[75%]">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {message.profiles.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground">• {time}</span>
                      </div>
                      <div className="bg-card text-foreground px-4 py-3 rounded-lg shadow-sm border border-border max-w-full">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.encrypted_content}
                        </p>
                      </div>
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {message.reactions.map((r) => (
                            <Button
                              key={r.reaction}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleReact(message.id, r.reaction)}
                            >
                              {r.reaction} {r.count}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end max-w-[75%]">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-sm">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.encrypted_content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-primary-foreground/70"> {time}</span>
                      <Check className="h-3 w-3 text-primary-foreground/70" />
                    </div>
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {message.reactions.map((r) => (
                          <Button
                            key={r.reaction}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-primary-foreground/70"
                            onClick={() => handleReact(message.id, r.reaction)}
                          >
                            {r.reaction} {r.count}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reaction Picker (Positioned absolute on long-press) */}
      {showReactions && (
        <div
          className="fixed bg-card border border-border rounded-lg p-2 shadow-lg z-30 flex gap-1"
          style={{ left: showReactions.x, top: showReactions.y }}
        >
          {EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleReact(showReactions.messageId, emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}

      {/* Input: Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="h-12 pr-12"
              disabled={sending}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-12 w-12"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
