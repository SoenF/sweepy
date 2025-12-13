import { Capacitor } from '@capacitor/core';
import MobileApiService from './MobileApiService';
import { 
  getLocalMembers, 
  getLocalChores, 
  upsertBatchMembers, 
  upsertBatchChores,
  queueSyncChange
} from './Database';

class MobileSyncManager {
  constructor() {
    this.syncInProgress = false;
    this.isMobile = Capacitor.isNativePlatform();
  }

  async isOnline() {
    if (this.isMobile) {
      // For mobile, we can use Capacitor's network plugin if available
      // For now, simple ping to the API
      return await MobileApiService.isOnline();
    } else {
      // For web, use standard navigator.onLine
      return navigator.onLine;
    }
  }

  async syncWithServer() {
    if (this.syncInProgress) {
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncInProgress = true;

    try {
      // Synchronize with server
      const syncResult = await MobileApiService.syncChanges();

      if (syncResult.members) {
        await upsertBatchMembers(syncResult.members);
      }
      
      if (syncResult.chores) {
        await upsertBatchChores(syncResult.chores);
      }

      return { 
        success: true, 
        data: syncResult,
        message: `Sync completed. Processed ${syncResult.applied?.length || 0} changes.`
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return { 
        success: false, 
        message: error.message,
        error: 'Could not sync with server'
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Queue a change for later sync
  async queueChange(changeType, changeData) {
    try {
      // If online, try to sync immediately
      const isOnline = await this.isOnline();
      
      if (isOnline) {
        // Try to push immediately
        try {
          const result = await MobileApiService.pushChange(changeType, changeData);
          return { success: true, immediate: true, result };
        } catch (error) {
          // If immediate push fails, queue it
          console.warn('Immediate push failed, queuing for later:', error);
          await queueSyncChange(changeType, changeData);
          return { success: true, immediate: false, queued: true };
        }
      } else {
        // Offline, queue the change
        await queueSyncChange(changeType, changeData);
        return { success: true, immediate: false, queued: true };
      }
    } catch (error) {
      console.error('Queue change error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get local data when offline
  async getLocalData() {
    const [members, chores] = await Promise.all([
      getLocalMembers(),
      getLocalChores()
    ]);
    
    return { members, chores };
  }

  // Initialize sync on app start
  async initializeSync() {
    try {
      const isOnline = await this.isOnline();
      
      if (isOnline) {
        // Sync with server
        await this.syncWithServer();
      } else {
        console.log('Offline mode: using local data');
      }
    } catch (error) {
      console.error('Sync initialization error:', error);
    }
  }
}

export default new MobileSyncManager();