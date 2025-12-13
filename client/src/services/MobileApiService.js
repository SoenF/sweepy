import { getSyncQueue, markSyncItemsProcessed, upsertBatchMembers, upsertBatchChores } from './Database';

class MobileApiService {
  constructor() {
    // Use the same URL pattern as web but adapt for mobile
    this.baseUrl = this.getApiBaseUrl();
  }

  getApiBaseUrl() {
    // Try to get from preferences first (for mobile), fallback to localStorage (for web), then environment variables
    try {
      // For Capacitor apps, we might need to access the URL differently
      // For now, let's use the same approach as web but could be extended
      const apiUrl = localStorage.getItem('API_URL') || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      return apiUrl.replace(/\/api$/, '');
    } catch (error) {
      console.error('Error getting API URL:', error);
      return import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:3000'; // default fallback
    }
  }

  async getAuthToken() {
    try {
      // Try Capacitor Preferences first (mobile), fallback to localStorage (web)
      const { Preferences } = await import('@capacitor/preferences');
      const tokenResult = await Preferences.get({ key: 'auth_token' });
      return tokenResult.value;
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Fallback to localStorage for web compatibility
      return localStorage.getItem('auth_token');
    }
  }

  async setAuthToken(token) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'auth_token', value: token });
      localStorage.setItem('auth_token', token); // Fallback for web
    } catch (error) {
      console.error('Error setting auth token:', error);
      localStorage.setItem('auth_token', token); // fallback to localStorage
    }
  }

  async apiCall(endpoint, options = {}) {
    const token = await this.getAuthToken();

    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    // Build the URL correctly by checking if baseUrl already contains the API path
    const fullUrl = this.baseUrl.endsWith('/api') ? `${this.baseUrl}${endpoint}` : `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(fullUrl, config);

    if (response.status === 401) {
      // Clear token if unauthorized
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'auth_token' });
      } catch (error) {
        console.error('Error clearing mobile token:', error);
      }
      localStorage.removeItem('auth_token');
      throw new Error('Unauthorized - please log in again');
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication methods
  async login(familyName, password) {
    try {
      const response = await this.apiCall('/auth/login', {
        method: 'POST',
        body: { family_name: familyName, password }
      });
      
      if (response.token) {
        await this.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(familyName, password) {
    try {
      const response = await this.apiCall('/auth/signup', {
        method: 'POST',
        body: { family_name: familyName, password }
      });
      
      if (response.token) {
        await this.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Sync methods
  async syncData() {
    try {
      const syncResult = await this.apiCall('/sync/data', { method: 'GET' });
      return syncResult;
    } catch (error) {
      console.error('Sync data error:', error);
      throw error;
    }
  }

  async syncChanges() {
    try {
      const changes = await getSyncQueue();
      
      if (changes.length === 0) {
        // Just fetch the latest data
        return await this.syncData();
      }

      const response = await this.apiCall('/sync/changes', {
        method: 'POST',
        body: { changes: changes.map(c => ({ type: c.type, data: c.data })) }
      });

      // Mark successfully processed changes
      if (response.applied && response.applied.length > 0) {
        const processedIds = changes.slice(0, response.applied.length).map(c => c.id);
        await markSyncItemsProcessed(processedIds);
      }

      return response;
    } catch (error) {
      console.error('Sync changes error:', error);
      throw error;
    }
  }

  // Push single change
  async pushChange(changeType, changeData) {
    try {
      const response = await this.apiCall('/sync/push', {
        method: 'POST',
        body: { type: changeType, data: changeData }
      });

      return response;
    } catch (error) {
      console.error('Push change error:', error);
      throw error;
    }
  }

  // All other API methods
  async getMembers() {
    return await this.apiCall('/members');
  }

  async createMember(data) {
    const result = await this.apiCall('/members', {
      method: 'POST',
      body: data
    });

    return result;
  }

  async updateMember(id, data) {
    return await this.apiCall(`/members/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async deleteMember(id) {
    return await this.apiCall(`/members/${id}`, { method: 'DELETE' });
  }

  async getChores() {
    return await this.apiCall('/chores');
  }

  async createChore(data) {
    return await this.apiCall('/chores', {
      method: 'POST',
      body: data
    });
  }

  async updateChore(id, data) {
    return await this.apiCall(`/chores/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async deleteChore(id) {
    return await this.apiCall(`/chores/${id}`, { method: 'DELETE' });
  }

  async getAssignments(start, end) {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return await this.apiCall(`/schedule?${params.toString()}`);
  }

  async toggleTask(id, memberId = null) {
    return await this.apiCall(`/schedule/${id}/toggle`, {
      method: 'PATCH',
      body: { member_id: memberId }
    });
  }

  async generateSchedule(days = 30) {
    return await this.apiCall('/schedule/generate', {
      method: 'POST',
      body: { days }
    });
  }

  // Check if online
  async isOnline() {
    try {
      // Create a fetch with timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Build the URL correctly by checking if baseUrl already contains the API path
      const fullUrl = this.baseUrl.endsWith('/api') ? `${this.baseUrl}/auth` : `${this.baseUrl}/api/auth`;
      const response = await fetch(fullUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new MobileApiService();