import { Capacitor } from '@capacitor/core';
import * as DB from '../services/Database';

// Use environment variable first, then localStorage as override, finally default
const getApiUrl = () => {
    // Priority: env var → localStorage override → fallback
    const envUrl = import.meta.env.VITE_API_URL;
    const storageUrl = localStorage.getItem('API_URL');

    return storageUrl || envUrl || 'http://localhost:3000/api';
};

const isMobile = Capacitor.isNativePlatform();

/**
 * Enhanced fetch wrapper with Caching for GET requests
 * Strategy: Network First -> Fallback to Cache
 */
const fetchWithCache = async (endpoint, options = {}) => {
    const url = `${getApiUrl()}${endpoint}`;
    const cacheKey = `cache_${endpoint}`;

    // Add JWT token to headers if available (web only)
    if (!isMobile) {
        const token = localStorage.getItem('auth_token');
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }
    }

    try {
        const res = await fetch(url, options);

        // Handle authentication errors
        if (res.status === 401 && !isMobile) {
            // Token expired or invalid - redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_family');
            window.location.href = '/login';
            throw new Error('Authentication required');
        }

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

export const updateChore = async (id, data) => {
    if (isMobile) return DB.updateLocalChore(id, data);
    return fetchWithCache(`/chores/${id}`, {
        method: 'PUT',
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
    if (isMobile) return DB.generateLocalSchedule(days);
    return fetchWithCache('/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
    });
};

export const toggleTask = async (id, memberId = null) => {
    if (isMobile) return DB.toggleLocalTask(id, memberId);
    return fetchWithCache(`/schedule/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId })
    });
};
