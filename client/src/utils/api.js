import { Capacitor } from '@capacitor/core';
import * as DB from '../services/Database';

// Use a dynamic URL if set in localStorage (useful for mobile testing on same wifi)
// Otherwise default to localhost. Can be overridden in console via: localStorage.setItem('API_URL', 'http://192.168.x.x:3000')
const getApiUrl = () => {
    return localStorage.getItem('API_URL') || 'http://localhost:3000/api';
};

const isMobile = Capacitor.isNativePlatform();

/**
 * Enhanced fetch wrapper with Caching for GET requests
 * Strategy: Network First -> Fallback to Cache
 */
const fetchWithCache = async (endpoint, options = {}) => {
    const url = `${getApiUrl()}${endpoint}`;
    const cacheKey = `cache_${endpoint}`;

    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = await res.json();

        // If it's a GET request, cache the successful response
        if (!options.method || options.method === 'GET') {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        }

        return data;
    } catch (err) {
        console.warn(`[Network Failed] ${url}`, err);

        // Fallback to cache if available for GET requests
        if (!options.method || options.method === 'GET') {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                console.info(`[Serving Cache] ${endpoint}`);
                return JSON.parse(cached);
            }
        }
        throw err; // Propagate error if no cache
    }
};

// Members
export const getMembers = async () => {
    if (isMobile) return DB.getLocalMembers();
    return fetchWithCache('/members');
};

export const createMember = async (data) => {
    if (isMobile) return DB.addLocalMember(data);
    return fetchWithCache('/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
};

export const deleteMember = async (id) => {
    if (isMobile) return DB.deleteLocalMember(id);
    return fetchWithCache(`/members/${id}`, { method: 'DELETE' });
};

export const resetPoints = async () => {
    // If mobile, likely need a DB method for this
    // For now, no-op or implement later
    if (isMobile) return;
    return fetchWithCache('/members/points/reset', { method: 'POST' });
};

// Chores
export const getChores = async () => {
    if (isMobile) return DB.getLocalChores();
    return fetchWithCache('/chores');
};

export const createChore = async (data) => {
    if (isMobile) return DB.addLocalChore(data);
    return fetchWithCache('/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
};

export const deleteChore = async (id) => {
    if (isMobile) return DB.deleteLocalChore(id);
    return fetchWithCache(`/chores/${id}`, { method: 'DELETE' });
};

// Schedule
export const getAssignments = async (start, end) => {
    if (isMobile) return DB.getLocalAssignments(start, end);
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return fetchWithCache(`/schedule?${params.toString()}`);
};

export const generateSchedule = async (days = 30) => {
    // Mobile generation not yet implemented
    if (isMobile) return [];
    return fetchWithCache('/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
    });
};

export const toggleTask = async (id, memberId = null) => {
    // Mobile toggle not yet fully implemented in DB
    if (isMobile) return;
    return fetchWithCache(`/schedule/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId })
    });
};
