import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface SponsoredAdCardProps {
  ad: {
    id: string;
    ad_type: string;
    title: string | null;
    content: string | null;
    image_url: string | null;
    target_url: string | null;
    post_id: string | null;
    user_id: string;
  };
  placement: string;
  variant?: 'feed' | 'search' | 'featured';
}

export const SponsoredAdCard = ({ ad, placement, variant = 'feed' }: SponsoredAdCardProps) => {
  const [clicked, setClicked] = useState(false);

  const handleImpression = async () => {
    try {
      await supabase.rpc('record_ad_impression', {
        p_ad_id: ad.id,
        p_placement: placement
      });
    } catch (error) {
      console.error('Failed to record impression:', error);
    }
  };

  const handleClick = async () => {
    if (clicked) return;
    setClicked(true);
    
    try {
      await supabase.rpc('record_ad_click', {
        p_ad_id: ad.id,
        p_placement: placement
      });
    } catch (error) {
      console.error('Failed to record click:', error);
    }
  };

  // Record impression on mount
  useState(() => {
    handleImpression();
  });

  if (ad.ad_type === 'promoted_post' && ad.post_id) {
    return (
      <Link to={`/post/${ad.post_id}`} onClick={handleClick}>
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              Sponsored
            </Badge>
          </div>
          {ad.image_url && (
            <img 
              src={ad.image_url} 
              alt="Sponsored content"
              className="w-full rounded-lg mb-3 object-cover max-h-48"
            />
          )}
          {ad.content && (
            <p className="text-sm line-clamp-3">{ad.content}</p>
          )}
        </Card>
      </Link>
    );
  }

  const CardContent = (
    <Card 
      className={`p-4 border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors ${
        variant === 'search' ? 'mb-2' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs">
          Sponsored
        </Badge>
        {ad.target_url && (
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      
      {ad.image_url && (
        <img 
          src={ad.image_url} 
          alt={ad.title || 'Sponsored content'}
          className="w-full rounded-lg mb-3 object-cover max-h-48"
        />
      )}
      
      {ad.title && (
        <h4 className="font-medium mb-1 line-clamp-2">{ad.title}</h4>
      )}
      
      {ad.content && (
        <p className="text-sm text-muted-foreground line-clamp-2">{ad.content}</p>
      )}
    </Card>
  );

  if (ad.target_url) {
    return (
      <a 
        href={ad.target_url.startsWith('http') ? ad.target_url : `https://${ad.target_url}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {CardContent}
      </a>
    );
  }

  return CardContent;
};

export default SponsoredAdCard;
