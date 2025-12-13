import React, { createContext, useContext, useEffect, useState } from 'react';
import MobileSyncManager from '../services/MobileSyncManager';

const SyncContext = createContext();

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [online, setOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  const [lastSync, setLastSync] = useState(null);

  // Check connectivity on component mount
  useEffect(() => {
    checkConnectivity();
    
    // Set up periodic connectivity check
    const interval = setInterval(checkConnectivity, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Check connectivity and handle online/offline transitions
  const checkConnectivity = async () => {
    try {
      const isOnline = await MobileSyncManager.isOnline();
      setOnline(isOnline);
      
      // If device just came online, initiate sync
      if (isOnline && !online) {
        await handleSync();
      }
    } catch (error) {
      console.error('Connectivity check error:', error);
    }
  };

  const handleSync = async () => {
    if (!online) return;
    
    setSyncStatus('syncing');
    try {
      const result = await MobileSyncManager.syncWithServer();
      if (result.success) {
        setLastSync(new Date().toISOString());
        setSyncStatus('idle');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
    }
  };

  // Queue a change (either sync immediately if online, or store for later)
  const queueChange = async (changeType, changeData) => {
    const result = await MobileSyncManager.queueChange(changeType, changeData);
    if (!result.immediate && result.queued) {
      // If we're online but the change was queued (maybe due to error),
      // try to sync again
      if (online) {
        setTimeout(() => {
          handleSync();
        }, 1000);
      }
    }
    return result;
  };

  const value = {
    online,
    syncStatus,
    lastSync,
    queueChange,
    syncNow: handleSync,
    refreshConnectivity: checkConnectivity
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};