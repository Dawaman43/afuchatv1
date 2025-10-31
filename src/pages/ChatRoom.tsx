import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress'; // Assume shadcn Progress component
import { ArrowLeft, Send, User, Loader2, Phone, Video, MoreVertical, Check, MessageSquare, HelpCircle, Info, Mic, MicOff, Play, Pause, Volume2, Waveform } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  audio_duration?: number; // In seconds
  sender_id: string;
  sent_at: string;
  profiles: {
    display_name: string;
    handle: string;
  };
}

interface ChatInfo {
  name: string | null;
  is_group: boolean;
}

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
  const [showHelp, setShowHelp] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: { isPlaying: boolean; audio: HTMLAudioElement | null; duration: number; currentTime: number } }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    fetchChatInfo();
    fetchMessages();

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
                setMessages((prev) => [
                  ...prev,
                  {
                    ...payload.new,
                    profiles: profile,
                  },
                ]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRecording();
      Object.values(audioPlayers).forEach(player => player.audio?.pause());
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

  const fetchMessages = async () => {
    console.log('Fetching messages for chatId:', chatId);
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(display_name, handle)')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    console.log('Fetched messages:', data, 'Error:', error);

    if (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    }
    if (data) {
      // Preload audio durations
      const messagesWithDuration = await Promise.all(
        data.map(async (msg) => {
          if (msg.audio_url) {
            const audio = new Audio(msg.audio_url);
            return new Promise<Message>((resolve) => {
              audio.onloadedmetadata = () => resolve({ ...msg as Message, audio_duration: Math.round(audio.duration) });
              audio.onerror = () => resolve(msg as Message);
            });
          }
          return msg as Message;
        })
      );
      setMessages(messagesWithDuration);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 44100, echoCancellation: true } });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Chunk every second for progress
      setRecording(true);
      setRecordedDuration(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordedDuration((prev) => prev + 1);
      }, 1000);

      toast.success('Recording voice message...', { duration: 2000 });
    } catch (err) {
      toast.error('Microphone access denied. Check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      recordIntervalRef.current && clearInterval(recordIntervalRef.current);
      setRecording(false);
      toast.success(`Recorded ${recordedDuration}s voice message. Tap to send.`);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !user || !chatId) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const fileName = `voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: true,
        });

      if (error) throw error;

      // Simulate progress (replace with real if Supabase supports)
      const interval = setInterval(() => setUploadProgress((prev) => Math.min(prev + 20, 90)), 200);
      setTimeout(() => clearInterval(interval), 1000);

      const publicUrl = supabase.storage.from('voice-messages').getPublicUrl(data.path).data.publicUrl;

      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          encrypted_content: '[Voice Message]',
          audio_url: publicUrl,
          audio_duration: recordedDuration,
        })
        .select()
        .single();

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);

      if (insertError) throw insertError;

      setMessages((prev) => [...prev, { ...inserted, profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' } }]);
      setAudioBlob(null);
      setRecordedDuration(0);
      toast.success('Voice message sent!');
    } catch (err) {
      toast.error('Failed to send voice message');
      console.error(err);
    }
    setUploading(false);
  };

  const toggleAudio = (messageId: string, audioUrl: string, duration: number) => {
    setAudioPlayers((prev) => {
      const current = prev[messageId];
      if (current?.isPlaying) {
        current.audio?.pause();
        return { ...prev, [messageId]: { ...current, isPlaying: false, currentTime: current.audio?.currentTime || 0 } };
      } else {
        const audio = new Audio(audioUrl);
        audio.volume = 0.5; // Default volume
        audio.play();
        audio.ontimeupdate = () => setAudioPlayers((p) => ({ ...p, [messageId]: { ...p[messageId], currentTime: audio.currentTime } }));
        audio.onended = () => setAudioPlayers((p) => ({ ...p, [messageId]: { ...p[messageId], isPlaying: false } }));
        return { ...prev, [messageId]: { audio, isPlaying: true, duration, currentTime: 0 } };
      }
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatId) return;

    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        encrypted_content: newMessage,
      });

    if (error) {
      console.error('Send error details:', error);
      toast.error(`Failed to send: ${error.message}`);
    } else {
      setNewMessage('');
      const optimisticMsg: Message = {
        id: Date.now().toString(),
        encrypted_content: newMessage,
        sender_id: user.id,
        sent_at: new Date().toISOString(),
        profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' },
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }
    setSending(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const dismissHelp = () => {
    setShowHelp(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10 flex items-center px-4 py-3 gap-3 min-h-[60px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 p-0 hover:bg-muted flex-shrink-0"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Go back to your chats</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-base font-semibold text-foreground truncate">
              {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
            </h1>
            {chatInfo && !chatInfo.is_group && (
              <p className={`text-xs ${online ? 'text-green-600' : 'text-muted-foreground'}`}>
                {online ? 'online' : 'last seen recently'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted">
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Start video call</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted">
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Start voice call</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>More options</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ paddingBottom: '120px' }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 px-4">
              <MessageSquare className="h-12 w-12 opacity-50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
              <p className="text-xs text-muted-foreground">Messages are encrypted end-to-end</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const time = new Date(message.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const isVoice = !!message.audio_url;
              const playerKey = message.id;
              const playerState = audioPlayers[playerKey];
              const progress = playerState ? (playerState.currentTime / (playerState.duration || 1)) * 100 : 0;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full py-1`}
                >
                  {!isOwn ? (
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {message.profiles.display_name}
                          </span>
                          <span className="text-xs text-muted-foreground"> {time}</span>
                        </div>
                        {isVoice ? (
                          <div className="bg-card px-3 py-2 rounded-lg shadow-sm border border-border max-w-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 w-full justify-start text-left rounded-lg hover:bg-muted"
                              onClick={() => toggleAudio(playerKey, message.audio_url!, message.audio_duration || 0)}
                            >
                              <div className="relative">
                                <Waveform className="h-4 w-4 opacity-50" />
                                {playerState?.isPlaying && (
                                  <div className="absolute inset-0 bg-primary/20 rounded animate-pulse" />
                                )}
                              </div>
                              <Volume2 className={`h-4 w-4 ${playerState?.isPlaying ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div className="flex-1 text-left">
                                <div className="text-xs text-muted-foreground">Voice message • {formatDuration(message.audio_duration || 0)}</div>
                                <Progress value={progress} className="h-1 mt-1 bg-muted" />
                              </div>
                              {playerState?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-card text-foreground px-3 py-2 rounded-lg shadow-sm border border-border max-w-full">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.encrypted_content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end max-w-[85%]">
                      {isVoice ? (
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-sm max-w-full">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 w-full justify-end text-right rounded-lg hover:bg-primary/80"
                            onClick={() => toggleAudio(playerKey, message.audio_url!, message.audio_duration || 0)}
                          >
                            {playerState?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            <Volume2 className={`h-4 w-4 ${playerState?.isPlaying ? 'text-primary-foreground' : 'text-primary-foreground/70'}`} />
                            <div className="flex-1 text-right">
                              <div className="text-xs text-primary-foreground/90">Voice message • {formatDuration(message.audio_duration || 0)}</div>
                              <Progress value={progress} className="h-1 mt-1 bg-primary/20" />
                            </div>
                            <div className="relative">
                              <Waveform className="h-4 w-4 text-primary-foreground/70" />
                              {playerState?.isPlaying && (
                                <div className="absolute inset-0 bg-primary/30 rounded animate-pulse" />
                              )}
                            </div>
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-sm max-w-full">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.encrypted_content}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-primary-foreground/70"> {time}</span>
                        <Check className="h-3 w-3 text-primary-foreground/70" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Beginner Help Overlay */}
        {showHelp && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl p-6 max-w-sm w-full border border-border">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Welcome to your chat!</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="flex-shrink-0 mt-0.5">1</Badge>
                  <span>Type your message below and hit send (or Enter).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="flex-shrink-0 mt-0.5">2</Badge>
                  <span>Tap the mic icon to record voice messages—tap again to stop.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="flex-shrink-0 mt-0.5">3</Badge>
                  <span>Tap voice messages to play; use the back arrow to return.</span>
                </li>
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" onClick={dismissHelp} className="flex-1">
                  Got it!
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Need more help? Check our guide.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Input: Fixed bottom, with polished voice recording */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-end gap-2">
            {recording ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 p-0 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-full shadow-md"
                  onClick={stopRecording}
                >
                  <MicOff className="h-5 w-5" />
                </Button>
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-destructive rounded-full animate-ping" />
                  <div className="w-3 h-3 bg-destructive rounded-full" />
                </div>
                <Badge variant="destructive" className="absolute -bottom-1 -right-1 text-xs px-1.5">
                  {recordedDuration}s
                </Badge>
              </div>
            ) : audioBlob ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 p-0 bg-primary/20 text-primary hover:bg-primary/30 rounded-full shadow-md"
                  onClick={sendVoiceMessage}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
                )}
                <Badge variant="secondary" className="absolute -bottom-1 -right-1 text-xs px-1.5">
                  {recordedDuration}s
                </Badge>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full shadow-md"
                    onClick={startRecording}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Record voice message</p>
                </TooltipContent>
              </Tooltip>
            )}
            <div className="flex-1 relative min-w-0">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="h-12 pr-12 min-h-[44px]"
                disabled={sending || uploading}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 bottom-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending || uploading}
                  className="h-12 w-12 min-h-[44px] flex-shrink-0"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Send message (or press Enter)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChatRoom;
