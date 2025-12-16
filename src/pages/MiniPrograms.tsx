import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { Search, Star, Download, Gamepad2, ShoppingBag, Music, Video, Book, Zap, Calendar, Plane, UtensilsCrossed, Car, CalendarCheck, Wallet, Image, Brain, Puzzle, Trophy, ChevronRight, Swords, Clock, Shield, FileText, Gift, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';

// Import app logos
import afuArenaLogo from '@/assets/mini-apps/afu-arena-logo.png';
import nexaCollectorLogo from '@/assets/mini-apps/nexa-collector-logo.png';
import memoryGameLogo from '@/assets/mini-apps/memory-game-logo.png';
import puzzleGameLogo from '@/assets/mini-apps/puzzle-game-logo.png';
import triviaGameLogo from '@/assets/mini-apps/trivia-game-logo.png';
import eventsLogo from '@/assets/mini-apps/events-logo.png';
import travelLogo from '@/assets/mini-apps/travel-logo.png';
import foodDeliveryLogo from '@/assets/mini-apps/food-delivery-logo.png';
import ridesLogo from '@/assets/mini-apps/rides-logo.png';
import bookingsLogo from '@/assets/mini-apps/bookings-logo.png';
import financeLogo from '@/assets/mini-apps/finance-logo.png';
import momentsLogo from '@/assets/mini-apps/moments-logo.png';
import shopshackLogo from '@/assets/mini-apps/shopshack-logo.png';
import giftsP2PLogo from '@/assets/mini-apps/gifts-p2p-logo.png';
import afumailLogo from '@/assets/mini-apps/afumail-logo.png';
interface MiniProgram {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  developer_id: string;
  category: string;
  url: string;
  install_count: number;
  rating: number;
  profiles: {
    display_name: string;
  };
}

interface BuiltInApp {
  id: string;
  name: string;
  description: string;
  icon: any;
  logo?: string;
  category: string;
  route: string;
  color: string;
  gradient: string;
  isBuiltIn: boolean;
  featured?: boolean;
  downloads?: string;
  rating?: number;
}

const MiniPrograms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [miniPrograms, setMiniPrograms] = useState<MiniProgram[]>([]);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; display_name: string } | null>(null);
  
  // Terms dialog state
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [pendingApp, setPendingApp] = useState<BuiltInApp | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [acceptedApps, setAcceptedApps] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_admin, avatar_url, display_name')
        .eq('id', user.id)
        .single();
      if (data) {
        setIsAdmin(data.is_admin || false);
        setUserProfile({ avatar_url: data.avatar_url, display_name: data.display_name });
      }
    };
    fetchUserData();
    
    // Load accepted apps from localStorage
    const savedAccepted = localStorage.getItem('acceptedMiniApps');
    if (savedAccepted) {
      setAcceptedApps(new Set(JSON.parse(savedAccepted)));
    }
  }, [user]);

  const categories = [
    { id: 'all', name: 'For you', icon: Zap },
    { id: 'games', name: 'Games', icon: Gamepad2 },
    { id: 'services', name: 'Services', icon: Star },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBag },
    { id: 'entertainment', name: 'Entertainment', icon: Music },
  ];

  const builtInGames: BuiltInApp[] = [
    { 
      id: 'afu-arena',
      name: 'Afu Arena',
      description: 'Real-time 1v1 reflex battle',
      icon: Swords,
      logo: afuArenaLogo,
      category: 'games',
      route: '/games/AfuArena',
      color: 'bg-primary',
      gradient: 'from-primary to-primary/60',
      isBuiltIn: true,
      featured: true,
      downloads: '10K+',
      rating: 4.8
    },
    { 
      id: 'nexa-collector',
      name: 'Nexa Collector',
      description: 'Collect Nexa and level up',
      icon: Zap,
      logo: nexaCollectorLogo,
      category: 'games',
      route: '/game',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500',
      isBuiltIn: true,
      downloads: '50K+',
      rating: 4.6
    },
    { 
      id: 'memory-match',
      name: 'Memory Match',
      description: 'Test your memory skills',
      icon: Brain,
      logo: memoryGameLogo,
      category: 'games',
      route: '/memory-game',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
      isBuiltIn: true,
      downloads: '25K+',
      rating: 4.5
    },
    { 
      id: '15-puzzle',
      name: '15 Puzzle',
      description: 'Classic sliding puzzle',
      icon: Puzzle,
      logo: puzzleGameLogo,
      category: 'games',
      route: '/puzzle-game',
      color: 'bg-blue-600',
      gradient: 'from-blue-600 to-cyan-500',
      isBuiltIn: true,
      downloads: '15K+',
      rating: 4.4
    },
    { 
      id: 'trivia-challenge',
      name: 'Trivia Challenge',
      description: 'Test your knowledge',
      icon: Brain,
      logo: triviaGameLogo,
      category: 'games',
      route: '/trivia-game',
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-purple-600',
      isBuiltIn: true,
      downloads: '20K+',
      rating: 4.7
    },
  ];

  const builtInServices: BuiltInApp[] = [
    { 
      id: 'shopshack',
      name: 'ShopShack',
      description: 'Shop quality products',
      icon: ShoppingBag,
      logo: shopshackLogo,
      category: 'shopping',
      route: '/shop/3e75ceb8-e9c1-4399-93c0-5b8620f40fda',
      color: 'bg-primary',
      gradient: 'from-primary to-primary/60',
      isBuiltIn: true,
      featured: true,
      downloads: '100K+',
      rating: 4.9
    },
    { 
      id: 'events',
      name: 'Events',
      description: 'Discover events near you',
      icon: Calendar,
      logo: eventsLogo,
      category: 'services',
      route: '/events',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
      isBuiltIn: true,
      downloads: '30K+',
      rating: 4.3
    },
    { 
      id: 'travel',
      name: 'Travel',
      description: 'Book flights and hotels',
      icon: Plane,
      logo: travelLogo,
      category: 'services',
      route: '/travel',
      color: 'bg-sky-500',
      gradient: 'from-sky-500 to-blue-500',
      isBuiltIn: true,
      downloads: '45K+',
      rating: 4.5
    },
    { 
      id: 'food-delivery',
      name: 'Food Delivery',
      description: 'Order from restaurants',
      icon: UtensilsCrossed,
      logo: foodDeliveryLogo,
      category: 'services',
      route: '/food-delivery',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500',
      isBuiltIn: true,
      downloads: '80K+',
      rating: 4.6
    },
    { 
      id: 'rides',
      name: 'Rides',
      description: 'Book transportation',
      icon: Car,
      logo: ridesLogo,
      category: 'services',
      route: '/rides',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-emerald-500',
      isBuiltIn: true,
      downloads: '60K+',
      rating: 4.4
    },
    { 
      id: 'bookings',
      name: 'Bookings',
      description: 'Manage reservations',
      icon: CalendarCheck,
      logo: bookingsLogo,
      category: 'services',
      route: '/bookings',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
      isBuiltIn: true,
      downloads: '35K+',
      rating: 4.2
    },
    { 
      id: 'finance',
      name: 'Financial Hub',
      description: 'Manage your wallet',
      icon: Wallet,
      logo: financeLogo,
      category: 'services',
      route: '/wallet',
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
      isBuiltIn: true,
      downloads: '70K+',
      rating: 4.7
    },
    {
      id: 'moments',
      name: 'Moments',
      description: 'Share stories',
      icon: Image,
      logo: momentsLogo,
      category: 'services',
      route: '/moments',
      color: 'bg-pink-500',
      gradient: 'from-pink-500 to-rose-500',
      isBuiltIn: true,
      downloads: '55K+',
      rating: 4.8
    },
    {
      id: 'gifts-p2p',
      name: 'Gifts P2P',
      description: 'Trade rare gifts with others',
      icon: Gift,
      logo: giftsP2PLogo,
      category: 'shopping',
      route: '/shop',
      color: 'bg-teal-500',
      gradient: 'from-teal-500 to-cyan-500',
      isBuiltIn: true,
      downloads: '15K+',
      rating: 4.6
    },
    {
      id: 'afumail',
      name: 'AfuMail',
      description: 'Full email service',
      icon: Mail,
      logo: afumailLogo,
      category: 'services',
      route: '/afumail',
      color: 'bg-primary',
      gradient: 'from-primary to-cyan-500',
      isBuiltIn: true,
      featured: true,
      downloads: '5K+',
      rating: 4.9
    },
  ];

  useEffect(() => {
    fetchMiniPrograms();
    fetchInstalledApps();
  }, []);

  const fetchMiniPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('mini_programs')
        .select(`*, profiles (display_name)`)
        .eq('is_published', true)
        .order('install_count', { ascending: false });

      if (error) throw error;
      setMiniPrograms(data || []);
    } catch (error) {
      console.error('Error fetching mini programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstalledApps = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_mini_programs')
        .select('mini_program_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setInstalledApps(new Set(data.map(d => d.mini_program_id)));
    } catch (error) {
      console.error('Error fetching installed apps:', error);
    }
  };

  const handleAppClick = (app: BuiltInApp) => {
    // Check if it's a service and user is not admin - show coming soon
    if (app.category === 'services' && !isAdmin) {
      toast.info('Coming soon!');
      return;
    }
    
    // Check if terms already accepted for this app
    if (acceptedApps.has(app.id)) {
      navigate(app.route);
      return;
    }
    
    // Show terms dialog
    setPendingApp(app);
    setTermsAccepted(false);
    setTermsDialogOpen(true);
  };

  const handleAcceptTerms = () => {
    if (!pendingApp || !termsAccepted) return;
    
    // Save accepted app
    const newAccepted = new Set(acceptedApps);
    newAccepted.add(pendingApp.id);
    setAcceptedApps(newAccepted);
    localStorage.setItem('acceptedMiniApps', JSON.stringify([...newAccepted]));
    
    // Navigate to app
    setTermsDialogOpen(false);
    navigate(pendingApp.route);
  };

  const allBuiltInApps = [...builtInGames, ...builtInServices];
  
  const filteredBuiltInApps = allBuiltInApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredApps = [...builtInGames.filter(g => g.featured), ...builtInServices.filter(s => s.featured)];

  // Enhanced Game Card component - more polished and real looking
  const GameCard = ({ app }: { app: BuiltInApp }) => {
    const Icon = app.icon;
    
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleAppClick(app)}
        className="w-44 flex-shrink-0 cursor-pointer group"
      >
        {/* Card Container */}
        <div className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-all">
          {/* Game Banner/Cover */}
          <div className={`relative h-28 bg-gradient-to-br ${app.gradient} overflow-hidden`}>
            {app.logo ? (
              <>
                <img 
                  src={app.logo} 
                  alt={app.name} 
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Icon className="h-12 w-12 text-white/80" />
              </div>
            )}
            
            {/* Featured Badge */}
            {app.featured && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-yellow-500/90 text-yellow-950 border-0 text-[10px] font-bold shadow-md">
                  ⭐ Featured
                </Badge>
              </div>
            )}
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Gamepad2 className="h-5 w-5 text-primary ml-0.5" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Game Info */}
          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm truncate">{app.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{app.description}</p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{app.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="h-3 w-3" />
                <span className="text-[10px] font-medium">{app.downloads}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Google Play style app card component - uses actual logos
  const AppCard = ({ app, size = 'medium' }: { app: BuiltInApp; size?: 'small' | 'medium' | 'large' }) => {
    const Icon = app.icon;
    const isComingSoon = app.category === 'services' && !isAdmin;
    
    const sizeClasses = {
      small: 'w-20',
      medium: 'w-[88px]',
      large: 'w-28'
    };
    
    const iconSizeClasses = {
      small: 'h-16 w-16',
      medium: 'h-[72px] w-[72px]',
      large: 'h-24 w-24'
    };
    
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => handleAppClick(app)}
        className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer`}
      >
        <div className={`relative ${iconSizeClasses[size]} rounded-[22px] shadow-lg mb-2 overflow-hidden ${isComingSoon ? 'opacity-60' : ''}`}>
          {app.logo ? (
            <img 
              src={app.logo} 
              alt={app.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`h-full w-full ${app.color} flex items-center justify-center`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          )}
          {isComingSoon && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-xs font-medium truncate text-center">{app.name}</p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <Star className="h-2.5 w-2.5 fill-muted-foreground text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{app.rating || 4.5}</span>
        </div>
      </motion.div>
    );
  };

  // Google Play style list item component - uses actual logos
  const AppListItem = ({ app }: { app: BuiltInApp }) => {
    const Icon = app.icon;
    const isComingSoon = app.category === 'services' && !isAdmin;
    
    return (
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => handleAppClick(app)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 cursor-pointer transition-colors"
      >
        <div className={`h-16 w-16 rounded-[16px] shadow-md overflow-hidden flex-shrink-0 ${isComingSoon ? 'opacity-60' : ''}`}>
          {app.logo ? (
            <img 
              src={app.logo} 
              alt={app.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`h-full w-full ${app.color} flex items-center justify-center`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{app.name}</p>
            {isComingSoon && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                Soon
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{app.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{app.rating || 4.5}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className="text-[11px] text-muted-foreground">{app.downloads || '10K+'}</span>
          </div>
        </div>
        <Button 
          size="sm" 
          variant={isComingSoon ? "secondary" : "default"}
          className="rounded-full px-4 h-8 text-xs"
          disabled={isComingSoon}
        >
          {isComingSoon ? 'Soon' : 'Open'}
        </Button>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-safe">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              {user ? (
                <ProfileDrawer
                  trigger={
                    <button className="flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userProfile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {userProfile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  }
                />
              ) : null}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search apps and games"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-full bg-muted/50 border-0"
                />
              </div>
            </div>
            
            {/* Category tabs - Google Play style */}
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary border-2 border-primary' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>
        </div>

        <div className="px-4 py-4 space-y-6">
          {/* Featured Banner - Google Play style large cards with logos */}
          {selectedCategory === 'all' && !searchQuery && featuredApps.length > 0 && (
            <section>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-4">
                  {featuredApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <motion.div
                        key={app.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAppClick(app)}
                        className="w-[280px] flex-shrink-0 cursor-pointer"
                      >
                        <div className={`relative h-36 rounded-2xl bg-gradient-to-br ${app.gradient} p-4 shadow-lg overflow-hidden`}>
                          {app.logo && (
                            <div className="absolute -right-4 -bottom-4 opacity-30">
                              <img src={app.logo} alt="" className="h-32 w-32 object-cover" />
                            </div>
                          )}
                          <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex items-center gap-2">
                              {app.logo && (
                                <img src={app.logo} alt={app.name} className="h-10 w-10 rounded-xl shadow-md" />
                              )}
                              <Badge className="bg-white/20 text-white border-0 text-[10px]">
                                Featured
                              </Badge>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{app.name}</h3>
                              <p className="text-white/80 text-xs">{app.description}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </section>
          )}

          {/* Shopping Section - ShopShack featured */}
          {(selectedCategory === 'all' || selectedCategory === 'shopping') && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Shopping</h2>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-4">
                  {builtInServices.filter(s => 
                    s.category === 'shopping' &&
                    (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((app) => (
                    <AppCard key={app.id} app={app} size="large" />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </section>
          )}

          {/* Games Section - Enhanced cards */}
          {(selectedCategory === 'all' || selectedCategory === 'games') && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Games</h2>
                  <p className="text-xs text-muted-foreground">Play & earn Nexa</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 h-8 px-3 rounded-full"
                  onClick={() => navigate('/leaderboard')}
                >
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-semibold">Leaderboard</span>
                </Button>
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {builtInGames.filter(g => 
                    !searchQuery || 
                    g.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((app) => (
                    <GameCard key={app.id} app={app} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </section>
          )}

          {/* Services Section - List view like Play Store */}
          {(selectedCategory === 'all' || selectedCategory === 'services') && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Services</h2>
                {!isAdmin && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Clock className="h-3 w-3" />
                    Coming Soon
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {builtInServices.filter(s => 
                  s.category === 'services' &&
                  (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map((app) => (
                  <AppListItem key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}

          {/* Search Results */}
          {searchQuery && filteredBuiltInApps.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Search Results</h2>
              <div className="space-y-1">
                {filteredBuiltInApps.map((app) => (
                  <AppListItem key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {searchQuery && filteredBuiltInApps.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Terms Agreement Dialog */}
      <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {pendingApp && (
                <div className="h-12 w-12 rounded-xl shadow-md overflow-hidden">
                  {pendingApp.logo ? (
                    <img src={pendingApp.logo} alt={pendingApp.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full ${pendingApp.color} flex items-center justify-center`}>
                      <pendingApp.icon className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
              )}
              <div>
                <DialogTitle>{pendingApp?.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  Review before using
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Privacy & Data</p>
                  <p className="text-xs text-muted-foreground">This app may collect and use data as described in our privacy policy.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Terms of Use</p>
                  <p className="text-xs text-muted-foreground">By using this app, you agree to our terms of service and acceptable use policy.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Gamepad2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">App Responsibility</p>
                  <p className="text-xs text-muted-foreground">You are responsible for your actions within this app. Misuse may result in account restrictions.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                I have read and agree to the terms of use and privacy policy for this app
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setTermsDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAcceptTerms}
              disabled={!termsAccepted}
              className="flex-1"
            >
              Accept & Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MiniPrograms;
