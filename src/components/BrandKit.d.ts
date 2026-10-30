import React from 'react';

export interface BrandKitProps {
  activeSection?: string;
  activeTab?: string;
  onSectionChange?: (section: string) => void;
  setActiveTab?: (tab: string) => void;
  showHero?: boolean;
  showLocalTabs?: boolean;
  onNavigateToAudit?: () => void;
  pushToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  /** Tab to activate on mount / cross-module navigation (e.g. 'pdf-guidelines') */
  initialTab?: string;
  /** When true, scrolls the page to the PDF Guidelines section after it mounts */
  scrollToPdfSection?: boolean;
  /** Called after the scroll has been triggered so the parent can reset the flag */
  onScrollComplete?: () => void;
}

declare const BrandKit: React.FC<BrandKitProps>;
export default BrandKit;
