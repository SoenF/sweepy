import apiService from '../services/ApiService';
import { Capacitor } from '@capacitor/core';
import * as DB from '../services/Database';

const isMobile = Capacitor.isNativePlatform();

/**
 * API helper functions with offline support for mobile
 * Strategy: Use SQLite on mobile for offline capability, API for web
 */

// ===== UTILITY FUNCTIONS =====

export const getApiBaseUrl = () => {
    return apiService.baseUrl;
};

// ===== MEMBERS =====

export const getMembers = async () => {
    if (isMobile) {
        // Mobile: Try API first, fallback to local DB
        try {
            const members = await apiService.getMembers();
            // Update local DB with fresh data
            if (members && Array.isArray(members)) {
                await DB.upsertBatchMembers(members);
            }
            return members;
        } catch (error) {
            console.warn('[getMembers] API failed, using local DB:', error);
            return DB.getLocalMembers();
        }
    } else {
        // Web: Direct API call
        return apiService.getMembers();
    }
};

export const createMember = async (data) => {
    if (isMobile) {
        try {
            const member = await apiService.createMember(data);
            await DB.addLocalMember({ ...member, server_id: member._id });
            return member;
        } catch (error) {
            // Offline: queue for sync
            console.warn('[createMember] API failed, queuing for sync:', error);
            const localMember = await DB.addLocalMember(data);
            await DB.addToSyncQueue({ type: 'create_member', data });
            return localMember;
        }
    } else {
        return apiService.createMember(data);
    }
};

export const deleteMember = async (id) => {
    if (isMobile) {
        try {
            await apiService.deleteMember(id);
            await DB.deleteLocalMember(id);
        } catch (error) {
            console.warn('[deleteMember] API failed, queuing for sync:', error);
            await DB.deleteLocalMember(id);
            await DB.addToSyncQueue({ type: 'delete_member', data: { id } });
        }
    } else {
        return apiService.deleteMember(id);
    }
};

export const resetPoints = async () => {
    // Not implemented in mobile DB yet
    if (isMobile) {
        try {
            return await apiService.apiCall('/members/points/reset', { method: 'POST' });
        } catch (error) {
            console.warn('[resetPoints] Failed:', error);
        }
    } else {
        return apiService.apiCall('/members/points/reset', { method: 'POST' });
    }
};

// ===== CHORES =====

export const getChores = async () => {
    if (isMobile) {
        try {
            const chores = await apiService.getChores();
            if (chores && Array.isArray(chores)) {
                await DB.upsertBatchChores(chores);
            }
            return chores;
        } catch (error) {
            console.warn('[getChores] API failed, using local DB:', error);
            return DB.getLocalChores();
        }
    } else {
        return apiService.getChores();
    }
};

export const createChore = async (data) => {
    if (isMobile) {
        try {
            const chore = await apiService.createChore(data);
            await DB.addLocalChore({ ...chore, server_id: chore._id });
            return chore;
        } catch (error) {
            console.warn('[createChore] API failed, queuing for sync:', error);
            const localChore = await DB.addLocalChore(data);
            await DB.addToSyncQueue({ type: 'create_chore', data });
            return localChore;
        }
    } else {
        return apiService.createChore(data);
    }
};

export const updateChore = async (id, data) => {
    if (isMobile) {
        try {
            const chore = await apiService.updateChore(id, data);
            await DB.updateLocalChore(id, chore);
            return chore;
        } catch (error) {
            console.warn('[updateChore] API failed, queuing for sync:', error);
            await DB.updateLocalChore(id, data);
            await DB.addToSyncQueue({ type: 'update_chore', data: { ...data, _id: id } });
        }
    } else {
        return apiService.updateChore(id, data);
    }
};

export const deleteChore = async (id) => {
    if (isMobile) {
        try {
            await apiService.deleteChore(id);
            await DB.deleteLocalChore(id);
        } catch (error) {
            console.warn('[deleteChore] API failed, queuing for sync:', error);
            await DB.deleteLocalChore(id);
            await DB.addToSyncQueue({ type: 'delete_chore', data: { id } });
        }
    } else {
        return apiService.deleteChore(id);
    }
};

// ===== SCHEDULE =====

export const getAssignments = async (start, end) => {
    if (isMobile) {
        try {
            return await apiService.getAssignments(start, end);
        } catch (error) {
            console.warn('[getAssignments] API failed, using local DB:', error);
            return DB.getLocalAssignments(start, end);
        }
    } else {
        return apiService.getAssignments(start, end);
    }
};

export const generateSchedule = async (days = 30) => {
    if (isMobile) {
        try {
            return await apiService.generateSchedule(days);
        } catch (error) {
            console.warn('[generateSchedule] API failed, using local:', error);
            return DB.generateLocalSchedule(days);
        }
    } else {
        return apiService.generateSchedule(days);
    }
};

export const toggleTask = async (id, memberId = null) => {
    if (isMobile) {
        try {
            return await apiService.toggleTask(id, memberId);
        } catch (error) {
            console.warn('[toggleTask] API failed, queuing for sync:', error);
            const result = await DB.toggleLocalTask(id, memberId);
            await DB.addToSyncQueue({
                type: 'complete_assignment',
                data: { assignmentId: id, member_id: memberId }
            });
            return result;
        }
    } else {
        return apiService.toggleTask(id, memberId);
    }
};

// ===== SYNC (Mobile only) =====

export const syncWithServer = async () => {
    if (!isMobile) return;

    try {
        console.log('[syncWithServer] Starting sync...');

        // 1. Push queued changes
        const queue = await DB.getSyncQueue();
        if (queue.length > 0) {
            console.log(`[syncWithServer] Pushing ${queue.length} changes...`);
            const result = await apiService.pushBatchChanges(queue);

            if (result.applied && result.applied.length > 0) {
                // Clear synced items
                const syncedIds = result.applied.map((_, idx) => queue[idx].id);
                await DB.clearSyncQueue(syncedIds);
            }
        }

        // 2. Pull latest data
        console.log('[syncWithServer] Pulling latest data...');
        const syncData = await apiService.getFullSync();

        if (syncData.data) {
            const { members, chores, assignments } = syncData.data;
            if (members) await DB.upsertBatchMembers(members);
            if (chores) await DB.upsertBatchChores(chores);
            // if (assignments) await DB.upsertBatchAssignments(assignments);
        }

        console.log('[syncWithServer] Sync complete');
        return true;
    } catch (error) {
        console.error('[syncWithServer] Sync failed:', error);
        return false;
    }
};

export default {
    getApiBaseUrl,
    getMembers,
    createMember,
    deleteMember,
    resetPoints,
    getChores,
    createChore,
    updateChore,
    deleteChore,
    getAssignments,
    generateSchedule,
    toggleTask,
    syncWithServer
};

