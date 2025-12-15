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
import { Search, Star, Download, Gamepad2, ShoppingBag, Music, Video, Book, Zap, Calendar, Plane, UtensilsCrossed, Car, CalendarCheck, Wallet, Image, Brain, Puzzle, Trophy, ChevronRight, Swords, Clock, Shield, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';

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
  category: string;
  route: string;
  color: string;
  gradient: string;
  isBuiltIn: boolean;
  featured?: boolean;
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
  
  // Terms dialog state
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [pendingApp, setPendingApp] = useState<BuiltInApp | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [acceptedApps, setAcceptedApps] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      setIsAdmin(data?.is_admin || false);
    };
    checkAdmin();
    
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
      category: 'games',
      route: '/games/AfuArena',
      color: 'bg-primary',
      gradient: 'from-primary to-primary/60',
      isBuiltIn: true,
      featured: true
    },
    { 
      id: 'nexa-collector',
      name: 'Nexa Collector',
      description: 'Collect Nexa and level up',
      icon: Zap,
      category: 'games',
      route: '/game',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500',
      isBuiltIn: true
    },
    { 
      id: 'memory-match',
      name: 'Memory Match',
      description: 'Test your memory skills',
      icon: Brain,
      category: 'games',
      route: '/memory-game',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
      isBuiltIn: true
    },
    { 
      id: '15-puzzle',
      name: '15 Puzzle',
      description: 'Classic sliding puzzle',
      icon: Puzzle,
      category: 'games',
      route: '/puzzle-game',
      color: 'bg-blue-600',
      gradient: 'from-blue-600 to-cyan-500',
      isBuiltIn: true
    },
    { 
      id: 'trivia-challenge',
      name: 'Trivia Challenge',
      description: 'Test your knowledge',
      icon: Brain,
      category: 'games',
      route: '/trivia-game',
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-purple-600',
      isBuiltIn: true
    },
  ];

  const builtInServices: BuiltInApp[] = [
    { 
      id: 'events',
      name: 'Events',
      description: 'Discover events near you',
      icon: Calendar,
      category: 'services',
      route: '/events',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
      isBuiltIn: true
    },
    { 
      id: 'travel',
      name: 'Travel',
      description: 'Book flights and hotels',
      icon: Plane,
      category: 'services',
      route: '/travel',
      color: 'bg-sky-500',
      gradient: 'from-sky-500 to-blue-500',
      isBuiltIn: true
    },
    { 
      id: 'food-delivery',
      name: 'Food Delivery',
      description: 'Order from restaurants',
      icon: UtensilsCrossed,
      category: 'services',
      route: '/food-delivery',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500',
      isBuiltIn: true
    },
    { 
      id: 'rides',
      name: 'Rides',
      description: 'Book transportation',
      icon: Car,
      category: 'services',
      route: '/rides',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-emerald-500',
      isBuiltIn: true
    },
    { 
      id: 'bookings',
      name: 'Bookings',
      description: 'Manage reservations',
      icon: CalendarCheck,
      category: 'services',
      route: '/bookings',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
      isBuiltIn: true
    },
    { 
      id: 'finance',
      name: 'Financial Hub',
      description: 'Manage your wallet',
      icon: Wallet,
      category: 'services',
      route: '/wallet',
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
      isBuiltIn: true
    },
    { 
      id: 'moments',
      name: 'Moments',
      description: 'Share stories',
      icon: Image,
      category: 'services',
      route: '/moments',
      color: 'bg-pink-500',
      gradient: 'from-pink-500 to-rose-500',
      isBuiltIn: true
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

  const featuredApps = builtInGames.filter(g => g.featured);

  // Google Play style app card component
  const AppCard = ({ app, size = 'medium' }: { app: BuiltInApp; size?: 'small' | 'medium' | 'large' }) => {
    const Icon = app.icon;
    const isComingSoon = app.category === 'services' && !isAdmin;
    
    const sizeClasses = {
      small: 'w-24',
      medium: 'w-32',
      large: 'w-40'
    };
    
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => handleAppClick(app)}
        className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer`}
      >
        <div className={`relative aspect-square rounded-2xl ${app.color} shadow-lg mb-2 flex items-center justify-center ${isComingSoon ? 'opacity-60' : ''}`}>
          <Icon className="h-10 w-10 text-white" />
          {isComingSoon && (
            <div className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-sm font-medium truncate">{app.name}</p>
        <p className="text-xs text-muted-foreground truncate">{app.category}</p>
      </motion.div>
    );
  };

  // Google Play style list item component
  const AppListItem = ({ app }: { app: BuiltInApp }) => {
    const Icon = app.icon;
    const isComingSoon = app.category === 'services' && !isAdmin;
    
    return (
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => handleAppClick(app)}
        className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 cursor-pointer transition-colors"
      >
        <div className={`h-14 w-14 rounded-xl ${app.color} shadow-md flex items-center justify-center flex-shrink-0 ${isComingSoon ? 'opacity-60' : ''}`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{app.name}</p>
            {isComingSoon && (
              <Badge variant="secondary" className="text-[10px] py-0">
                <Clock className="h-3 w-3 mr-1" />
                Soon
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{app.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-xs text-muted-foreground">4.5</span>
            </div>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground capitalize">{app.category}</span>
          </div>
        </div>
        <Button 
          size="sm" 
          variant={isComingSoon ? "secondary" : "default"}
          className="rounded-full px-6"
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
          {/* Featured Banner - Google Play style large cards */}
          {selectedCategory === 'all' && !searchQuery && featuredApps.length > 0 && (
            <section>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {featuredApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <motion.div
                        key={app.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAppClick(app)}
                        className="w-[300px] flex-shrink-0 cursor-pointer"
                      >
                        <div className={`relative h-40 rounded-2xl bg-gradient-to-br ${app.gradient} p-4 shadow-lg overflow-hidden`}>
                          <div className="absolute -right-8 -bottom-8 opacity-20">
                            <Icon className="h-40 w-40 text-white" />
                          </div>
                          <div className="relative z-10 h-full flex flex-col justify-between">
                            <Badge className="w-fit bg-white/20 text-white border-0">
                              Featured
                            </Badge>
                            <div>
                              <h3 className="text-xl font-bold text-white">{app.name}</h3>
                              <p className="text-white/80 text-sm">{app.description}</p>
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

          {/* Games Section - Horizontal scroll */}
          {(selectedCategory === 'all' || selectedCategory === 'games') && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Games</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary gap-1"
                  onClick={() => navigate('/leaderboard')}
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {builtInGames.filter(g => 
                    !searchQuery || 
                    g.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((app) => (
                    <AppCard key={app.id} app={app} size="medium" />
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
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Coming Soon
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {builtInServices.filter(s => 
                  !searchQuery || 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                <div className={`h-12 w-12 rounded-xl ${pendingApp.color} shadow-md flex items-center justify-center`}>
                  <pendingApp.icon className="h-6 w-6 text-white" />
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
