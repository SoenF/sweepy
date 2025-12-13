import { getSyncQueue, clearSyncQueue, upsertBatchMembers, upsertBatchChores, getLocalMembers, getLocalChores } from './Database';
import { getApiBaseUrl } from '../utils/api';

export const syncData = async (token) => {
    if (!token) return;

    try {
        console.log('Starting sync...');
        const baseUrl = getApiBaseUrl(); // Use centralized config
        // Note: In real app, consider using Context or ENV for URL overrides.

        // 1. PUSH changes
        const queue = await getSyncQueue();
        if (queue.length > 0) {
            console.log(`Pushing ${queue.length} changes...`);
            const response = await fetch(`${baseUrl}/sync/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ changes: queue })
            });

            if (!response.ok) {
                throw new Error('Failed to push changes');
            }

            const resData = await response.json();

            // Clear synced items
            if (resData.syncedIds && resData.syncedIds.length > 0) {
                await clearSyncQueue(resData.syncedIds);
            }
        }

        // 2. PULL changes
        console.log('Pulling latest data...');
        const pullRes = await fetch(`${baseUrl}/sync/state`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!pullRes.ok) throw new Error('Failed to pull data');

        const { members, chores, assignments } = await pullRes.json();

        // 3. Update Local DB
        if (members) await upsertBatchMembers(members);
        if (chores) await upsertBatchChores(chores);
        // if (assignments) await upsertBatchAssignments(assignments);

        console.log('Sync complete');
        return true;
    } catch (err) {
        console.error('Sync failed:', err);
        return false;
    }
};
