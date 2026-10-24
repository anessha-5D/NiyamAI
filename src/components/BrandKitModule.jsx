import React from 'react';
import BrandKit from './BrandKit';

/**
 * Backward compatibility wrapper for BrandKit
 */
export default function BrandKitModule({
  activeTab = 'all',
  setActiveTab,
  showHero = true,
  showLocalTabs = false,
}) {
  return (
    <BrandKit
      activeSection={activeTab}
      onSectionChange={setActiveTab}
      showHero={showHero}
      showLocalTabs={showLocalTabs}
    />
  );
}

export { BrandKit };
