import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const AdsterraSocialAd = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Load Adsterra social ad script dynamically
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//pl28165504.effectivegatecpm.com/c8/c1/df/c8c1df713e04eeb218462e699ebdd685.js';
    
    if (adRef.current) {
      adRef.current.appendChild(script);
    }

    // Check if ad loaded after a delay
    const checkAdLoad = setTimeout(() => {
      if (adRef.current && adRef.current.children.length > 0) {
        setAdLoaded(true);
      }
    }, 1500);

    return () => {
      clearTimeout(checkAdLoad);
      if (adRef.current && script.parentNode === adRef.current) {
        adRef.current.removeChild(script);
      }
    };
  }, []);

  // Don't render if ad didn't load
  if (!adLoaded) {
    return null;
  }

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Adsterra Social Ad Content */}
      <div ref={adRef} className="relative p-4">
        {/* Sponsored Label - right side */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <Badge variant="secondary" className="text-[10px] font-medium bg-accent/40 text-accent-foreground border border-accent/20 backdrop-blur-sm">
            Sponsored
          </Badge>
        </div>
      </div>
    </div>
  );
};
