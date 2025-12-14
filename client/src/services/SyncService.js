import { getSyncQueue, clearSyncQueue, upsertBatchMembers, upsertBatchChores, getLocalMembers, getLocalChores } from './Database';
import { getApiBaseUrl } from '../utils/api';
import apiService from './ApiService';

export const syncData = async (token) => {
    if (!token) return;

    try {
        console.log('Starting sync...');

        // 1. PUSH changes
        const queue = await getSyncQueue();
        if (queue.length > 0) {
            console.log(`Pushing ${queue.length} changes...`);
            const result = await apiService.pushBatchChanges(queue);

            if (result.applied && result.applied.length > 0) {
                // Clear synced items - using correct property names from server response
                const successfullyAppliedIndices = result.applied.map(item => item.index);
                const successfullyAppliedItems = queue.filter((_, index) => successfullyAppliedIndices.includes(index));
                const successfullyAppliedIds = successfullyAppliedItems.map(item => item.id);
                await clearSyncQueue(successfullyAppliedIds);
            }
        }

        // 2. PULL changes
        console.log('Pulling latest data...');
        const syncData = await apiService.getFullSync();

        if (syncData.data) {
            const { members, chores, assignments } = syncData.data;
            if (members) await upsertBatchMembers(members);
            if (chores) await upsertBatchChores(chores);
            // if (assignments) await upsertBatchAssignments(assignments);
        }

        console.log('Sync complete');
        return true;
    } catch (err) {
        console.error('Sync failed:', err);
        return false;
    }
};
