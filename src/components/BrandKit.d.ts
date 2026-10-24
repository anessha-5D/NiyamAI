import React from 'react';

export interface BrandKitProps {
  activeSection?: string;
  activeTab?: string;
  onSectionChange?: (section: string) => void;
  setActiveTab?: (tab: string) => void;
  showHero?: boolean;
  showLocalTabs?: boolean;
}

declare const BrandKit: React.FC<BrandKitProps>;
export default BrandKit;
