import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Ad {
  id: string;
  ad_type: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  target_url: string | null;
  post_id: string | null;
  product_id: string | null;
  user_id: string;
}

export const useAds = (placement: 'feed' | 'search' | 'featured' | 'all', limit: number = 3) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase.rpc('get_ads_for_placement', {
          p_placement: placement,
          p_limit: limit
        });

        if (error) throw error;
        setAds(data || []);
      } catch (error) {
        console.error('Error fetching ads:', error);
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [placement, limit]);

  return { ads, loading };
};

export default useAds;
