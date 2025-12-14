import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import apiService from '../services/ApiService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [family, setFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMobile = Capacitor.isNativePlatform();

    // Restore session on app launch (both web and mobile)
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const storedToken = await apiService.getAuthToken();
                const storedFamily = await apiService.getFamily();

                if (storedToken && storedFamily) {
                    setToken(storedToken);
                    setFamily(storedFamily);
                    console.log('[AuthContext] Session restored for:', storedFamily.family_name);
                } else {
                    console.log('[AuthContext] No stored session found');
                }
            } catch (error) {
                console.error('[AuthContext] Error restoring session:', error);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (family_name, password) => {
        console.log('[AuthContext] Login attempt for:', family_name);

        try {
            const data = await apiService.login(family_name, password);
            setToken(data.token);
            setFamily(data.family);
            console.log('[AuthContext] Login successful');
            return data;
        } catch (error) {
            console.error('[AuthContext] Login failed:', error);
            throw error;
        }
    };

    const signup = async (family_name, password) => {
        console.log('[AuthContext] Signup attempt for:', family_name);

        try {
            const data = await apiService.signup(family_name, password);
            setToken(data.token);
            setFamily(data.family);
            console.log('[AuthContext] Signup successful');
            return data;
        } catch (error) {
            console.error('[AuthContext] Signup failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        console.log('[AuthContext] Logging out');
        await apiService.logout();
        setToken(null);
        setFamily(null);
    };

    const value = {
        token,
        family,
        login,
        signup,
        logout,
        isAuthenticated: !!token,
        loading,
        isMobile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
