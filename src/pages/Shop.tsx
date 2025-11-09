import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, ShoppingBag, Check, Sparkles, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  item_type: 'accessory' | 'theme' | 'effect' | 'badge';
  xp_cost: number;
  emoji: string;
  config: any;
  is_featured?: boolean;
  discount_percentage?: number;
  featured_end_date?: string;
}

interface UserPurchase {
  shop_item_id: string;
}

export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch featured items
      const { data: featuredData, error: featuredError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_featured', true)
        .eq('is_available', true)
        .gte('featured_end_date', new Date().toISOString())
        .order('discount_percentage', { ascending: false });

      if (featuredError) throw featuredError;

      setFeaturedItems((featuredData || []) as ShopItem[]);

      // Fetch shop items
      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_available', true)
        .order('xp_cost', { ascending: true });

      if (itemsError) throw itemsError;

      setItems((itemsData || []) as ShopItem[]);

      // Fetch user purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('user_shop_purchases')
        .select('shop_item_id')
        .eq('user_id', user.id);

      if (purchasesError) throw purchasesError;

      // Fetch user XP
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;


      setPurchases(purchasesData || []);
      setUserXP(profileData?.xp || 0);
    } catch (error) {
      console.error('Error fetching shop data:', error);
      toast.error('Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId: string, itemName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setPurchasing(itemId);
    try {
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_shop_item_id: itemId,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; new_xp?: number };

      if (result.success) {
        toast.success(`Purchased ${itemName}!`);
        setUserXP(result.new_xp || 0);
        fetchShopData(); // Refresh purchases
        
        // Dispatch XP update event
        window.dispatchEvent(new CustomEvent('xp-updated', { 
          detail: { xp: result.new_xp } 
        }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const isOwned = (itemId: string) => {
    return purchases.some(p => p.shop_item_id === itemId);
  };

  const getItemsByType = (type: string) => {
    return items.filter(item => item.item_type === type);
  };

  const getDiscountedPrice = (item: ShopItem) => {
    if (item.discount_percentage && item.discount_percentage > 0) {
      return Math.floor(item.xp_cost * (1 - item.discount_percentage / 100));
    }
    return item.xp_cost;
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const renderItems = (filteredItems: ShopItem[], showFeatured = false) => {
    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No items available in this category</p>
        </div>
      );
    }

    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const owned = isOwned(item.id);
          const discountedPrice = getDiscountedPrice(item);
          const canAfford = userXP >= discountedPrice;
          const isFeatured = item.is_featured && item.discount_percentage && item.discount_percentage > 0;

          return (
            <Card key={item.id} className={`${owned ? 'border-primary bg-primary/5' : ''} ${isFeatured ? 'border-2 border-yellow-500 shadow-lg' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  <div className="flex flex-col gap-1">
                    {owned && (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="w-3 h-3" />
                        Owned
                      </Badge>
                    )}
                    {isFeatured && (
                      <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-black">
                        <Zap className="w-3 h-3" />
                        {item.discount_percentage}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
                {isFeatured && item.featured_end_date && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    <Clock className="w-3 h-3" />
                    {getTimeRemaining(item.featured_end_date)}
                  </div>
                )}
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
                <div className="flex flex-col">
                  {isFeatured ? (
                    <>
                      <div className="font-bold text-primary text-lg">
                        {discountedPrice} XP
                      </div>
                      <div className="text-xs text-muted-foreground line-through">
                        {item.xp_cost} XP
                      </div>
                    </>
                  ) : (
                    <div className="font-bold text-primary text-lg">
                      {item.xp_cost} XP
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handlePurchase(item.id, item.name)}
                  disabled={owned || !canAfford || purchasing === item.id}
                  variant={owned ? 'outline' : 'default'}
                  size="sm"
                >
                  {purchasing === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : owned ? (
                    'Owned'
                  ) : !canAfford ? (
                    'Need More XP'
                  ) : (
                    'Purchase'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access the shop</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Badge variant="outline" className="gap-2 py-2 px-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold">{userXP} XP</span>
          </Badge>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            Cosmetic Shop
          </h1>
          <p className="text-muted-foreground">
            Purchase exclusive accessories and themes with your XP
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured Items Section */}
            {featuredItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold">Limited Edition</h2>
                  <Badge variant="outline" className="ml-auto">Weekly Deals</Badge>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 p-6 rounded-lg border-2 border-yellow-500/20">
                  {renderItems(featuredItems, true)}
                </div>
              </div>
            )}

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="accessory">Accessories</TabsTrigger>
                <TabsTrigger value="theme">Themes</TabsTrigger>
                <TabsTrigger value="effect">Effects</TabsTrigger>
                <TabsTrigger value="badge">Badges</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {renderItems(items)}
              </TabsContent>
              <TabsContent value="accessory">
                {renderItems(getItemsByType('accessory'))}
              </TabsContent>
              <TabsContent value="theme">
                {renderItems(getItemsByType('theme'))}
              </TabsContent>
              <TabsContent value="effect">
                {renderItems(getItemsByType('effect'))}
              </TabsContent>
              <TabsContent value="badge">
                {renderItems(getItemsByType('badge'))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
