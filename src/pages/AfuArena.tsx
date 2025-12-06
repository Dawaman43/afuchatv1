import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Trophy, 
  Users, 
  Copy, 
  Check, 
  Zap,
  Target,
  Crown,
  Timer,
  Loader2
} from 'lucide-react';
import Layout from '@/components/Layout';

type GameStatus = 'waiting' | 'playing' | 'finished';

interface GameRoom {
  id: string;
  room_code: string;
  host_id: string;
  guest_id: string | null;
  host_score: number;
  guest_score: number;
  status: GameStatus;
  round: number;
  max_rounds: number;
  current_target_x: number | null;
  current_target_y: number | null;
  target_spawned_at: string | null;
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

interface PlayerInfo {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

const AfuArena = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [hostInfo, setHostInfo] = useState<PlayerInfo | null>(null);
  const [guestInfo, setGuestInfo] = useState<PlayerInfo | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playSound = (frequency: number, duration: number) => {
    if (!audioContextRef.current) return;
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.15, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Fetch player info
  const fetchPlayerInfo = async (playerId: string): Promise<PlayerInfo | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', playerId)
      .single();
    return data;
  };

  // Create a new game room
  const createRoom = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }
    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          host_id: user.id,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;
      const typedData: GameRoom = { ...data, status: data.status as GameStatus };
      setGameRoom(typedData);
      const hostData = await fetchPlayerInfo(user.id);
      setHostInfo(hostData);
      toast.success('Room created! Share the code with a friend');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  // Join an existing room
  const joinRoom = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }
    if (!joinCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    setLoading(true);
    try {
      // Find the room
      const { data: room, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', joinCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (findError || !room) {
        toast.error('Room not found or game already started');
        return;
      }

      if (room.host_id === user.id) {
        toast.error('You cannot join your own room');
        return;
      }

      // Join the room
      const { data, error } = await supabase
        .from('game_rooms')
        .update({ guest_id: user.id })
        .eq('id', room.id)
        .select()
        .single();

      if (error) throw error;
      const typedData: GameRoom = { ...data, status: data.status as GameStatus };
      setGameRoom(typedData);
      
      const [hostData, guestData] = await Promise.all([
        fetchPlayerInfo(data.host_id),
        fetchPlayerInfo(user.id)
      ]);
      setHostInfo(hostData);
      setGuestInfo(guestData);
      
      toast.success('Joined room!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to room updates
  useEffect(() => {
    if (!gameRoom?.id) return;

    const channel = supabase
      .channel(`game-room-${gameRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${gameRoom.id}`
        },
        async (payload) => {
          const newRoom = payload.new as GameRoom;
          setGameRoom(newRoom);

          // Load guest info when they join
          if (newRoom.guest_id && !guestInfo) {
            const guestData = await fetchPlayerInfo(newRoom.guest_id);
            setGuestInfo(guestData);
          }

          // Handle target spawn
          if (newRoom.current_target_x !== null && newRoom.current_target_y !== null) {
            setTargetVisible(true);
            playSound(880, 0.1);
          }

          // Handle round winner
          if (newRoom.status === 'finished') {
            playSound(660, 0.5);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameRoom?.id, guestInfo]);

  // Start the game (host only)
  const startGame = async () => {
    if (!gameRoom || !user || gameRoom.host_id !== user.id) return;
    if (!gameRoom.guest_id) {
      toast.error('Waiting for opponent to join');
      return;
    }

    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      playSound(440, 0.2);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);
    playSound(880, 0.3);

    // Start game
    await supabase
      .from('game_rooms')
      .update({ 
        status: 'playing',
        started_at: new Date().toISOString()
      })
      .eq('id', gameRoom.id);

    spawnTarget();
  };

  // Spawn a target at random position
  const spawnTarget = async () => {
    if (!gameRoom) return;
    
    const x = 10 + Math.random() * 80; // 10-90% of width
    const y = 10 + Math.random() * 80; // 10-90% of height

    await supabase
      .from('game_rooms')
      .update({
        current_target_x: x,
        current_target_y: y,
        target_spawned_at: new Date().toISOString()
      })
      .eq('id', gameRoom.id);

    setTargetVisible(true);
  };

  // Handle target click
  const handleTargetClick = async () => {
    if (!gameRoom || !user || !targetVisible) return;
    
    setTargetVisible(false);
    playSound(523, 0.2);

    const isHost = gameRoom.host_id === user.id;
    const newHostScore = isHost ? gameRoom.host_score + 1 : gameRoom.host_score;
    const newGuestScore = !isHost ? gameRoom.guest_score + 1 : gameRoom.guest_score;
    const newRound = gameRoom.round + 1;
    
    setRoundWinner(user.id);
    setTimeout(() => setRoundWinner(null), 1000);

    // Check if game is over
    if (newRound > gameRoom.max_rounds) {
      const winnerId = newHostScore > newGuestScore 
        ? gameRoom.host_id 
        : newGuestScore > newHostScore 
          ? gameRoom.guest_id 
          : null;

      await supabase
        .from('game_rooms')
        .update({
          host_score: newHostScore,
          guest_score: newGuestScore,
          round: newRound,
          status: 'finished',
          winner_id: winnerId,
          ended_at: new Date().toISOString(),
          current_target_x: null,
          current_target_y: null
        })
        .eq('id', gameRoom.id);

      // Award XP to winner
      if (winnerId === user.id) {
        try {
          await supabase.rpc('award_xp', {
            p_user_id: user.id,
            p_action_type: 'game_played',
            p_xp_amount: 100,
            p_metadata: { game: 'afu_arena', won: true }
          });
          toast.success('Victory! +100 Nexa');
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      // Next round
      await supabase
        .from('game_rooms')
        .update({
          host_score: newHostScore,
          guest_score: newGuestScore,
          round: newRound,
          current_target_x: null,
          current_target_y: null
        })
        .eq('id', gameRoom.id);

      // Spawn next target after delay
      setTimeout(() => spawnTarget(), 1000 + Math.random() * 2000);
    }
  };

  // Copy room code
  const copyRoomCode = () => {
    if (gameRoom?.room_code) {
      navigator.clipboard.writeText(gameRoom.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Room code copied!');
    }
  };

  // Leave/cleanup room
  const leaveRoom = async () => {
    if (!gameRoom || !user) return;
    
    if (gameRoom.host_id === user.id) {
      await supabase.from('game_rooms').delete().eq('id', gameRoom.id);
    } else {
      await supabase
        .from('game_rooms')
        .update({ guest_id: null })
        .eq('id', gameRoom.id);
    }
    
    setGameRoom(null);
    setHostInfo(null);
    setGuestInfo(null);
    setTargetVisible(false);
  };

  // Play again
  const playAgain = async () => {
    if (!gameRoom || !user || gameRoom.host_id !== user.id) return;

    await supabase
      .from('game_rooms')
      .update({
        status: 'waiting',
        host_score: 0,
        guest_score: 0,
        round: 1,
        current_target_x: null,
        current_target_y: null,
        winner_id: null,
        started_at: null,
        ended_at: null
      })
      .eq('id', gameRoom.id);
  };

  const isHost = user && gameRoom?.host_id === user.id;
  const isGuest = user && gameRoom?.guest_id === user.id;

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-24">
        <main className="container max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Swords className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Afu Arena
              </h1>
            </div>
            <p className="text-muted-foreground">Real-time 1v1 reflex battle</p>
          </div>

          {!gameRoom ? (
            /* Lobby */
            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Create or Join Game
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={createRoom} 
                    className="w-full h-14 text-lg"
                    disabled={loading || !user}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Swords className="h-5 w-5 mr-2" />}
                    Create Room
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter room code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="h-14 text-center text-xl font-mono tracking-widest uppercase"
                      maxLength={6}
                    />
                    <Button 
                      onClick={joinRoom}
                      disabled={loading || !user || !joinCode.trim()}
                      className="h-14 px-6"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Join'}
                    </Button>
                  </div>

                  {!user && (
                    <p className="text-center text-sm text-muted-foreground">
                      Sign in to play multiplayer
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* How to play */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    How to Play
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-primary mt-0.5" />
                      <span>Targets appear randomly on screen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Be the first to tap the target to score</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Trophy className="h-4 w-4 text-amber-500 mt-0.5" />
                      <span>Win 5 rounds to claim victory (+100 Nexa)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : gameRoom.status === 'waiting' ? (
            /* Waiting Room */
            <div className="space-y-6">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Room Code</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-mono font-bold tracking-widest text-primary">
                        {gameRoom.room_code}
                      </span>
                      <Button variant="ghost" size="icon" onClick={copyRoomCode}>
                        {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Players */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-background rounded-xl p-4 text-center border">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {hostInfo?.avatar_url ? (
                          <img src={hostInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Crown className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <p className="font-semibold truncate">{hostInfo?.display_name || 'Host'}</p>
                      <p className="text-xs text-muted-foreground">Host</p>
                    </div>
                    <div className="bg-background rounded-xl p-4 text-center border border-dashed">
                      {guestInfo ? (
                        <>
                          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {guestInfo.avatar_url ? (
                              <img src={guestInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-semibold truncate">{guestInfo.display_name}</p>
                          <p className="text-xs text-muted-foreground">Challenger</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                          </div>
                          <p className="text-muted-foreground">Waiting...</p>
                          <p className="text-xs text-muted-foreground">Share code to invite</p>
                        </>
                      )}
                    </div>
                  </div>

                  {isHost && (
                    <Button 
                      onClick={startGame} 
                      className="w-full h-14 text-lg"
                      disabled={!gameRoom.guest_id}
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      {gameRoom.guest_id ? 'Start Battle!' : 'Waiting for opponent...'}
                    </Button>
                  )}

                  {isGuest && (
                    <div className="text-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-muted-foreground">Waiting for host to start...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button variant="outline" onClick={leaveRoom} className="w-full">
                Leave Room
              </Button>
            </div>
          ) : gameRoom.status === 'playing' ? (
            /* Game Area */
            <div className="space-y-4">
              {/* Countdown overlay */}
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                  >
                    <span className="text-9xl font-bold text-primary">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Score Board */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`rounded-xl p-3 text-center transition-all ${isHost ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'}`}>
                  <p className="text-xs text-muted-foreground truncate">{hostInfo?.display_name || 'Host'}</p>
                  <p className="text-3xl font-bold">{gameRoom.host_score}</p>
                </div>
                <div className="rounded-xl p-3 text-center bg-muted/50">
                  <p className="text-xs text-muted-foreground">Round</p>
                  <p className="text-2xl font-bold">{Math.min(gameRoom.round, gameRoom.max_rounds)}/{gameRoom.max_rounds}</p>
                </div>
                <div className={`rounded-xl p-3 text-center transition-all ${isGuest ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'}`}>
                  <p className="text-xs text-muted-foreground truncate">{guestInfo?.display_name || 'Guest'}</p>
                  <p className="text-3xl font-bold">{gameRoom.guest_score}</p>
                </div>
              </div>

              {/* Game Arena */}
              <div 
                ref={gameAreaRef}
                className="relative w-full aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-2xl border-2 border-primary/20 overflow-hidden"
              >
                <AnimatePresence>
                  {targetVisible && gameRoom.current_target_x !== null && gameRoom.current_target_y !== null && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                      onClick={handleTargetClick}
                      className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                      style={{
                        left: `${gameRoom.current_target_x}%`,
                        top: `${gameRoom.current_target_y}%`
                      }}
                    >
                      <Target className="h-8 w-8 text-primary-foreground" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Round winner flash */}
                <AnimatePresence>
                  {roundWinner && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-primary/20"
                    >
                      <span className="text-4xl font-bold text-primary">
                        {roundWinner === user?.id ? 'You scored!' : 'Opponent scored!'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!targetVisible && !roundWinner && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground animate-pulse">Get ready...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Game Over */
            <div className="space-y-6">
              <Card className="border-primary/30 overflow-hidden">
                <div className="bg-gradient-to-br from-primary/20 to-transparent p-6 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                  <h2 className="text-3xl font-bold mb-2">
                    {gameRoom.winner_id === user?.id 
                      ? 'Victory!' 
                      : gameRoom.winner_id === null 
                        ? 'Draw!' 
                        : 'Defeat'}
                  </h2>
                  <p className="text-muted-foreground">
                    {gameRoom.winner_id === user?.id 
                      ? 'You dominated the arena!' 
                      : gameRoom.winner_id === null
                        ? 'An even match!'
                        : 'Better luck next time!'}
                  </p>
                </div>
                <CardContent className="pt-6">
                  {/* Final Scores */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`rounded-xl p-4 text-center ${gameRoom.winner_id === gameRoom.host_id ? 'bg-amber-500/20 ring-2 ring-amber-500' : 'bg-muted'}`}>
                      <p className="text-sm text-muted-foreground mb-1">{hostInfo?.display_name || 'Host'}</p>
                      <p className="text-4xl font-bold">{gameRoom.host_score}</p>
                      {gameRoom.winner_id === gameRoom.host_id && (
                        <Crown className="h-5 w-5 mx-auto mt-2 text-amber-500" />
                      )}
                    </div>
                    <div className={`rounded-xl p-4 text-center ${gameRoom.winner_id === gameRoom.guest_id ? 'bg-amber-500/20 ring-2 ring-amber-500' : 'bg-muted'}`}>
                      <p className="text-sm text-muted-foreground mb-1">{guestInfo?.display_name || 'Guest'}</p>
                      <p className="text-4xl font-bold">{gameRoom.guest_score}</p>
                      {gameRoom.winner_id === gameRoom.guest_id && (
                        <Crown className="h-5 w-5 mx-auto mt-2 text-amber-500" />
                      )}
                    </div>
                  </div>

                  {isHost && (
                    <Button onClick={playAgain} className="w-full h-12 mb-3">
                      <Zap className="h-5 w-5 mr-2" />
                      Play Again
                    </Button>
                  )}

                  {isGuest && (
                    <div className="text-center py-4 mb-3">
                      <p className="text-muted-foreground">Waiting for host to restart...</p>
                    </div>
                  )}

                  <Button variant="outline" onClick={leaveRoom} className="w-full">
                    Leave Room
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default AfuArena;