import React, { createContext, useContext, useState, useCallback } from 'react';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(() => {
    const saved = localStorage.getItem('careermatch_subscription');
    return saved ? JSON.parse(saved) : {
      tier: 'free', // 'free' | 'premium'
      isDemo: true,
      status: 'active',
      expiresAt: null,
      features: {
        canOptimizeCV: false,
        canDownloadPDF: false,
        canDownloadDOCX: false,
        canAccessAdvancedATS: false,
        maxCVUploads: 3,
        maxJobSaves: 10
      }
    };
  });

  const updateSubscription = useCallback((updates) => {
    setSubscription((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('careermatch_subscription', JSON.stringify(next));
      return next;
    });
  }, []);

  const enableDemoPremium = useCallback(() => {
    updateSubscription({
      tier: 'premium',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      features: {
        canOptimizeCV: true,
        canDownloadPDF: true,
        canDownloadDOCX: true,
        canAccessAdvancedATS: true,
        maxCVUploads: 999,
        maxJobSaves: 999
      }
    });
  }, [updateSubscription]);

  const disableDemoPremium = useCallback(() => {
    updateSubscription({
      tier: 'free',
      status: 'active',
      expiresAt: null,
      features: {
        canOptimizeCV: false,
        canDownloadPDF: false,
        canDownloadDOCX: false,
        canAccessAdvancedATS: false,
        maxCVUploads: 3,
        maxJobSaves: 10
      }
    });
  }, [updateSubscription]);

  const isPremium = subscription.tier === 'premium';

  const value = {
    subscription,
    isPremium,
    updateSubscription,
    enableDemoPremium,
    disableDemoPremium
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}