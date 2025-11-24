import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, Gift, Heart, ShoppingBag, Mail, Send, Sparkles, ArrowUpRight, ArrowDownRight, Coins, Eye, EyeOff, RefreshCw, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ACoinConverter } from '@/components/currency/ACoinConverter';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const [gifts, tips, purchases, transfers, redEnvSent, redEnvClaimed] = await Promise.all([
        supabase
          .from('gift_transactions')
          .select('*, sender:profiles!gift_transactions_sender_id_fkey(display_name, handle), receiver:profiles!gift_transactions_receiver_id_fkey(display_name, handle), gift:gifts(*)')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('tips')
          .select('*, sender:profiles!tips_sender_id_fkey(display_name, handle), receiver:profiles!tips_receiver_id_fkey(display_name, handle)')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_shop_purchases')
          .select('*, item:shop_items(*)')
          .eq('user_id', user?.id)
          .order('purchased_at', { ascending: false })
          .limit(20),
        supabase
          .from('xp_transfers')
          .select('*, sender:profiles!xp_transfers_sender_id_fkey(display_name, handle), receiver:profiles!xp_transfers_receiver_id_fkey(display_name, handle)')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('red_envelopes')
          .select('*')
          .eq('sender_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('red_envelope_claims')
          .select('*, envelope:red_envelopes(*, sender:profiles(display_name, handle))')
          .eq('claimer_id', user?.id)
          .order('claimed_at', { ascending: false })
          .limit(20)
      ]);

      const all: any[] = [
        ...(gifts.data || []).map(t => ({ ...t, type: 'gift', timestamp: t.created_at })),
        ...(tips.data || []).map(t => ({ ...t, type: 'tip', timestamp: t.created_at })),
        ...(purchases.data || []).map(t => ({ ...t, type: 'purchase', timestamp: t.purchased_at })),
        ...(transfers.data || []).map(t => ({ ...t, type: 'transfer', timestamp: t.created_at })),
        ...(redEnvSent.data || []).map(t => ({ ...t, type: 'red_envelope_sent', timestamp: t.created_at })),
        ...(redEnvClaimed.data || []).map(t => ({ ...t, type: 'red_envelope_claimed', timestamp: t.claimed_at }))
      ];

      return all.sort((a, b) => 
        new Date(b.timestamp).getTime() - 
        new Date(a.timestamp).getTime()
      );
    },
    enabled: !!user?.id
  });

  const getTransactionIcon = (type: string) => {
    const iconClasses = "h-5 w-5";
    const wrapperClasses = "p-2.5 rounded-full";
    
    switch (type) {
      case 'gift': 
        return <div className={`${wrapperClasses} bg-pink-500/10`}><Gift className={`${iconClasses} text-pink-500`} /></div>;
      case 'tip': 
        return <div className={`${wrapperClasses} bg-red-500/10`}><Heart className={`${iconClasses} text-red-500`} /></div>;
      case 'purchase': 
        return <div className={`${wrapperClasses} bg-purple-500/10`}><ShoppingBag className={`${iconClasses} text-purple-500`} /></div>;
      case 'transfer': 
        return <div className={`${wrapperClasses} bg-indigo-500/10`}><Send className={`${iconClasses} text-indigo-500`} /></div>;
      case 'red_envelope_sent': 
        return <div className={`${wrapperClasses} bg-red-500/10`}><Mail className={`${iconClasses} text-red-500`} /></div>;
      case 'red_envelope_claimed': 
        return <div className={`${wrapperClasses} bg-green-500/10`}><Mail className={`${iconClasses} text-green-500`} /></div>;
      default: 
        return <div className={`${wrapperClasses} bg-primary/10`}><TrendingUp className={`${iconClasses} text-primary`} /></div>;
    }
  };

  const getTransactionLabel = (transaction: any) => {
    if (transaction.type === 'gift') {
      const isSender = transaction.sender_id === user?.id;
      return isSender 
        ? `Sent ${transaction.gift?.name} to @${transaction.receiver?.handle}`
        : `Received ${transaction.gift?.name} from @${transaction.sender?.handle}`;
    }
    if (transaction.type === 'tip') {
      const isSender = transaction.sender_id === user?.id;
      return isSender 
        ? `Tipped @${transaction.receiver?.handle}`
        : `Received tip from @${transaction.sender?.handle}`;
    }
    if (transaction.type === 'transfer') {
      const isSender = transaction.sender_id === user?.id;
      return isSender 
        ? `Transferred to @${transaction.receiver?.handle}`
        : `Received from @${transaction.receiver?.handle}`;
    }
    if (transaction.type === 'red_envelope_sent') {
      return `Red Envelope - ${transaction.recipient_count} recipients`;
    }
    if (transaction.type === 'red_envelope_claimed') {
      return `Claimed from @${transaction.envelope?.sender?.handle}'s Red Envelope`;
    }
    return `Purchased ${transaction.item?.name}`;
  };

  const getTransactionAmount = (transaction: any) => {
    if (transaction.type === 'red_envelope_sent') {
      return -transaction.total_amount;
    }
    if (transaction.type === 'red_envelope_claimed') {
      return transaction.amount;
    }
    if (transaction.type === 'transfer') {
      const isSender = transaction.sender_id === user?.id;
      return isSender ? -transaction.amount : transaction.amount;
    }
    
    const amount = transaction.xp_cost || transaction.xp_amount || transaction.xp_paid;
    const isSender = transaction.sender_id === user?.id;
    
    if (transaction.type === 'purchase' || (transaction.type !== 'purchase' && isSender)) {
      return -amount;
    }
    return amount;
  };

  const totalReceived = transactions?.filter(t => getTransactionAmount(t) > 0)
    .reduce((sum, t) => sum + getTransactionAmount(t), 0) || 0;
  
  const totalSent = transactions?.filter(t => getTransactionAmount(t) < 0)
    .reduce((sum, t) => sum + Math.abs(getTransactionAmount(t)), 0) || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchTransactions()
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
    toast({
      title: "Refreshed",
      description: "Wallet data updated successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="shrink-0"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nexa Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: "spring" }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <motion.div 
                    className="p-3 bg-primary/10 rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <WalletIcon className="h-6 w-6 text-primary" />
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowBalance(!showBalance)}
                    >
                      {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Badge variant="outline" className="font-semibold">
                      {profile?.current_grade || 'Newcomer'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Nexa Balance</p>
                <AnimatePresence mode="wait">
                  {showBalance ? (
                    <motion.p
                      key="visible"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-3xl font-bold text-primary"
                    >
                      {profile?.xp?.toLocaleString() || 0}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-3xl font-bold text-primary"
                    >
                      ••••••
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* ACoin Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, type: "spring" }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card className="relative overflow-hidden border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-background shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Coins className="h-6 w-6 text-yellow-600" />
                  </motion.div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => navigate('/premium')}
                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Premium
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-1">ACoin Balance</p>
                <AnimatePresence mode="wait">
                  {showBalance ? (
                    <motion.p
                      key="visible"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-3xl font-bold text-yellow-600"
                    >
                      {profile?.acoin?.toLocaleString() || 0}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-3xl font-bold text-yellow-600"
                    >
                      ••••••
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
        >
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="flex items-center justify-center mb-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-2 bg-green-500/10 rounded-full">
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-1">Received</p>
                  <motion.p 
                    className="text-lg font-bold text-green-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    +{totalReceived.toLocaleString()}
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="flex items-center justify-center mb-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-2 bg-red-500/10 rounded-full">
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-1">Sent</p>
                  <motion.p 
                    className="text-lg font-bold text-red-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    -{totalSent.toLocaleString()}
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="flex items-center justify-center mb-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-2 bg-primary/10 rounded-full">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                  <motion.p 
                    className="text-lg font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    {transactions?.length || 0}
                  </motion.p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ACoin Converter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
        >
          <ACoinConverter 
            currentNexa={profile?.xp || 0}
            currentACoin={profile?.acoin || 0}
            onConversionSuccess={() => {
              refetchProfile();
              toast({
                title: "Success!",
                description: "Nexa converted to ACoin successfully",
              });
            }}
          />
        </motion.div>

        {/* Quick Actions - Transfer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, type: "spring" }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={() => navigate('/transfer')} 
              className="w-full h-auto py-6 flex items-center justify-center gap-3 text-lg font-semibold shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Send className="h-6 w-6" />
              <span>Transfer Nexa</span>
            </Button>
          </motion.div>
        </motion.div>


        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
        >
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="received">Received</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-3 mt-0">
                  <AnimatePresence mode="popLayout">
                    {transactions?.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-12"
                      >
                        <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                          <WalletIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No transactions yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Start by sending gifts or tips to friends
                        </p>
                      </motion.div>
                    ) : (
                      transactions?.map((transaction, index) => {
                        const amount = getTransactionAmount(transaction);
                        const isNegative = amount < 0;

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer"
                          >
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              {getTransactionIcon(transaction.type)}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {getTransactionLabel(transaction)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <motion.p 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                                className={`text-lg font-bold ${isNegative ? 'text-red-500' : 'text-green-500'}`}
                              >
                                {isNegative ? '' : '+'}{Math.abs(amount).toLocaleString()}
                              </motion.p>
                              <p className="text-xs text-muted-foreground">Nexa</p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="received" className="space-y-3 mt-0">
                  <AnimatePresence mode="popLayout">
                    {transactions?.filter(t => getTransactionAmount(t) > 0).length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No received transactions
                      </motion.div>
                    ) : (
                      transactions?.filter(t => getTransactionAmount(t) > 0).map((transaction, index) => {
                        const amount = getTransactionAmount(transaction);

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer"
                          >
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              {getTransactionIcon(transaction.type)}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {getTransactionLabel(transaction)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <motion.p 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                                className="text-lg font-bold text-green-500"
                              >
                                +{amount.toLocaleString()}
                              </motion.p>
                              <p className="text-xs text-muted-foreground">Nexa</p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="sent" className="space-y-3 mt-0">
                  <AnimatePresence mode="popLayout">
                    {transactions?.filter(t => getTransactionAmount(t) < 0).length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No sent transactions
                      </motion.div>
                    ) : (
                      transactions?.filter(t => getTransactionAmount(t) < 0).map((transaction, index) => {
                        const amount = getTransactionAmount(transaction);

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer"
                          >
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              {getTransactionIcon(transaction.type)}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {getTransactionLabel(transaction)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <motion.p 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                                className="text-lg font-bold text-red-500"
                              >
                                {amount.toLocaleString()}
                              </motion.p>
                              <p className="text-xs text-muted-foreground">Nexa</p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                   </AnimatePresence>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Wallet;
