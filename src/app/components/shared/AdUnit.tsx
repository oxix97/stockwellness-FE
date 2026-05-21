import React, { useEffect } from 'react';
import { ADSENSE_CONFIG } from '@/config/adsense';

interface AdUnitProps {
  type: 'home-in-feed' | 'search-in-feed' | 'detail-in-article';
  className?: string;
}

const minHeights = {
  'home-in-feed': '120px',
  'search-in-feed': '120px',
  'detail-in-article': '280px'
};

export const AdUnit: React.FC<AdUnitProps> = ({ type, className }) => {
  const slotId = ADSENSE_CONFIG.slots[type.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof ADSENSE_CONFIG.slots];

  useEffect(() => {
    if (!ADSENSE_CONFIG.isDevelopment) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  if (ADSENSE_CONFIG.isDevelopment) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50 ${className}`}
        style={{ minHeight: minHeights[type] }}
      >
        <span className="text-sm text-muted-foreground">Ad Placeholder ({type})</span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`} style={{ minHeight: minHeights[type] }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: minHeights[type] }}
        data-ad-client={ADSENSE_CONFIG.clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
