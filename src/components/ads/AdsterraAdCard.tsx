import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

export const AdsterraAdCard = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Adsterra script dynamically
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//pl28165526.effectivegatecpm.com/3938e39e573566edcbbdc1594b4b1324/invoke.js';
    
    if (adRef.current) {
      adRef.current.appendChild(script);
    }

    return () => {
      if (adRef.current && script.parentNode === adRef.current) {
        adRef.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="border-b border-border p-4 bg-muted/30">
      {/* Sponsored Label - visually distinct from Google ads */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-[10px] font-medium bg-accent/30 text-accent-foreground border border-accent/20">
          Sponsored
        </Badge>
        <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
      </div>
      
      {/* Adsterra Ad Content */}
      <div ref={adRef} className="min-h-[120px]">
        <div id="container-3938e39e573566edcbbdc1594b4b1324"></div>
      </div>
    </div>
  );
};
