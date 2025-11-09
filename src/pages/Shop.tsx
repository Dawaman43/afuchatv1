import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  item_type: 'accessory' | 'theme' | 'effect' | 'badge';
  xp_cost: number;
  emoji: string;
  config: any;
}

interface UserPurchase {
  shop_item_id: string;
}

export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
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

  const renderItems = (filteredItems: ShopItem[]) => {
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
          const canAfford = userXP >= item.xp_cost;

          return (
            <Card key={item.id} className={owned ? 'border-primary bg-primary/5' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  {owned && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="w-3 h-3" />
                      Owned
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
                <div className="font-bold text-primary text-lg">
                  {item.xp_cost} XP
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
        )}
      </div>
    </div>
  );
}
