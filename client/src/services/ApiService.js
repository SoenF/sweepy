import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Unified API Service for both Web and Mobile
 * Handles authentication, requests, and offline capabilities
 */
class ApiService {
    constructor() {
        // For Android emulator: 10.0.2.2 maps to host's localhost
        // For physical device: use your computer's IP address (e.g., 192.168.1.100:3000)
        this.isMobile = Capacitor.isNativePlatform();

        // API URL configuration
        if (this.isMobile) {
            // Production: use Render backend
            this.baseUrl = 'https://homeflow-f54h.onrender.com/api';
            // For local development with Android emulator:
            // this.baseUrl = 'http://10.0.2.2:3000/api';
        } else {
            // Web app
            this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        }

        console.log('[ApiService] Initialized with baseUrl:', this.baseUrl);
    }

    /**
     * Get stored auth token
     */
    async getAuthToken() {
        if (this.isMobile) {
            const { value } = await Preferences.get({ key: 'auth_token' });
            return value;
        } else {
            return localStorage.getItem('auth_token');
        }
    }

    /**
     * Store auth token
     */
    async setAuthToken(token) {
        if (this.isMobile) {
            await Preferences.set({ key: 'auth_token', value: token });
        } else {
            localStorage.setItem('auth_token', token);
        }
    }

    /**
     * Remove auth token
     */
    async removeAuthToken() {
        if (this.isMobile) {
            await Preferences.remove({ key: 'auth_token' });
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    /**
     * Store family data
     */
    async setFamily(family) {
        const familyStr = JSON.stringify(family);
        if (this.isMobile) {
            await Preferences.set({ key: 'auth_family', value: familyStr });
        } else {
            localStorage.setItem('auth_family', familyStr);
        }
    }

    /**
     * Get stored family data
     */
    async getFamily() {
        let familyStr;
        if (this.isMobile) {
            const { value } = await Preferences.get({ key: 'auth_family' });
            familyStr = value;
        } else {
            familyStr = localStorage.getItem('auth_family');
        }
        return familyStr ? JSON.parse(familyStr) : null;
    }

    /**
     * Remove family data
     */
    async removeFamily() {
        if (this.isMobile) {
            await Preferences.remove({ key: 'auth_family' });
        } else {
            localStorage.removeItem('auth_family');
        }
    }

    /**
     * Generic API call with authentication
     */
    async apiCall(endpoint, options = {}) {
        const token = await this.getAuthToken();

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Type': this.isMobile ? 'mobile' : 'web',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        const url = `${this.baseUrl}${endpoint}`;
        console.log(`[ApiService] ${config.method} ${url}`);

        try {
            const response = await fetch(url, config);

            // Handle authentication errors
            if (response.status === 401) {
                console.warn('[ApiService] Authentication failed - clearing credentials');
                await this.removeAuthToken();
                await this.removeFamily();
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(error.error || error.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`[ApiService] Error:`, error);
            throw error;
        }
    }

    /**
     * Authentication - Login
     */
    async login(familyName, password) {
        console.log('[ApiService] Attempting login for:', familyName);

        const response = await this.apiCall('/auth/login', {
            method: 'POST',
            body: { family_name: familyName, password }
        });

        if (response.token) {
            await this.setAuthToken(response.token);
            await this.setFamily(response.family);
            console.log('[ApiService] Login successful, token stored');
        }

        return response;
    }

    /**
     * Authentication - Signup
     */
    async signup(familyName, password) {
        console.log('[ApiService] Attempting signup for:', familyName);

        const response = await this.apiCall('/auth/signup', {
            method: 'POST',
            body: { family_name: familyName, password }
        });

        if (response.token) {
            await this.setAuthToken(response.token);
            await this.setFamily(response.family);
            console.log('[ApiService] Signup successful, token stored');
        }

        return response;
    }

    /**
     * Authentication - Logout
     */
    async logout() {
        await this.removeAuthToken();
        await this.removeFamily();
        console.log('[ApiService] Logged out');
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const token = await this.getAuthToken();
        return !!token;
    }

    // ===== DATA SYNC ENDPOINTS =====

    /**
     * Get full sync data (mobile)
     */
    async getFullSync() {
        return this.apiCall('/api/sync/data');
    }

    /**
     * Push batch changes (mobile offline sync)
     */
    async pushBatchChanges(changes) {
        return this.apiCall('/api/sync/changes', {
            method: 'POST',
            body: { changes }
        });
    }

    /**
     * Push single change (mobile online)
     */
    async pushSingleChange(type, data) {
        return this.apiCall('/api/sync/push', {
            method: 'POST',
            body: { type, data }
        });
    }

    // ===== MEMBERS =====

    async getMembers() {
        return this.apiCall('/members');
    }

    async createMember(data) {
        return this.apiCall('/members', {
            method: 'POST',
            body: data
        });
    }

    async updateMember(id, data) {
        return this.apiCall(`/members/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    async deleteMember(id) {
        return this.apiCall(`/members/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== CHORES =====

    async getChores() {
        return this.apiCall('/chores');
    }

    async createChore(data) {
        return this.apiCall('/chores', {
            method: 'POST',
            body: data
        });
    }

    async updateChore(id, data) {
        return this.apiCall(`/chores/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    async deleteChore(id) {
        return this.apiCall(`/chores/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== SCHEDULE =====

    async getAssignments(start, end) {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        return this.apiCall(`/schedule?${params.toString()}`);
    }

    async generateSchedule(days = 30) {
        return this.apiCall('/schedule/generate', {
            method: 'POST',
            body: { days }
        });
    }

    async toggleTask(id, memberId = null) {
        return this.apiCall(`/schedule/${id}/toggle`, {
            method: 'PATCH',
            body: { member_id: memberId }
        });
    }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
