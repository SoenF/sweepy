// Use a dynamic URL if set in localStorage (useful for mobile testing on same wifi)
// Otherwise default to localhost. Can be overridden in console via: localStorage.setItem('API_URL', 'http://192.168.x.x:3000')
const getApiUrl = () => {
    return localStorage.getItem('API_URL') || 'http://localhost:3000/api';
};

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
export const getMembers = () => fetchWithCache('/members');

export const createMember = (data) => fetchWithCache('/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const deleteMember = (id) => fetchWithCache(`/members/${id}`, { method: 'DELETE' });

export const resetPoints = () => fetchWithCache('/members/points/reset', { method: 'POST' });

// Chores
export const getChores = () => fetchWithCache('/chores');

export const createChore = (data) => fetchWithCache('/chores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const deleteChore = (id) => fetchWithCache(`/chores/${id}`, { method: 'DELETE' });

// Schedule
export const getAssignments = (start, end) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return fetchWithCache(`/schedule?${params.toString()}`);
};

export const generateSchedule = (days = 30) => fetchWithCache('/schedule/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days })
});

export const toggleTask = (id, memberId = null) => fetchWithCache(`/schedule/${id}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId })
});
