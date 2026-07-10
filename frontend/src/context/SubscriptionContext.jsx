import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSubscription } from '../services/api';

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

  // Sync with backend subscription state
  const syncWithBackend = useCallback(async () => {
    try {
      const res = await getSubscription();
      const backendSub = res.data;
      if (backendSub) {
        updateSubscription({
          tier: backendSub.tier || 'free',
          status: backendSub.status || 'active',
          expiresAt: backendSub.expires_at || null,
          isDemo: backendSub.is_demo !== undefined ? backendSub.is_demo : true,
          features: backendSub.features || subscription.features,
        });
      }
    } catch (err) {
      // Silently fail — backend sync is best-effort
      console.warn('Backend subscription sync failed:', err);
    }
  }, [updateSubscription, subscription.features]);

  // Listen for subscription sync events from AuthContext
  useEffect(() => {
    const handleSync = (e) => {
      const backendSub = e.detail;
      if (backendSub) {
        updateSubscription({
          tier: backendSub.tier || 'free',
          status: backendSub.status || 'active',
          expiresAt: backendSub.expires_at || null,
          isDemo: backendSub.is_demo !== undefined ? backendSub.is_demo : true,
          features: backendSub.features || subscription.features,
        });
      }
    };
    window.addEventListener('subscription-sync', handleSync);
    return () => window.removeEventListener('subscription-sync', handleSync);
  }, [updateSubscription, subscription.features]);

  // Initial sync with backend on mount (if authenticated)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      syncWithBackend();
    }
  }, [syncWithBackend]);

  const isPremium = subscription.tier === 'premium';

  const value = {
    subscription,
    isPremium,
    updateSubscription,
    enableDemoPremium,
    disableDemoPremium,
    syncWithBackend
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