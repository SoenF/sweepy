import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

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

    // Mobile app doesn't need authentication
    useEffect(() => {
        if (isMobile) {
            setLoading(false);
            return;
        }

        // Restore session from localStorage
        const storedToken = localStorage.getItem('auth_token');
        const storedFamily = localStorage.getItem('auth_family');

        if (storedToken && storedFamily) {
            setToken(storedToken);
            setFamily(JSON.parse(storedFamily));
        }

        setLoading(false);
    }, [isMobile]);

    const login = async (family_name, password) => {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ family_name, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        setToken(data.token);
        setFamily(data.family);

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_family', JSON.stringify(data.family));

        return data;
    };

    const signup = async (family_name, password) => {
        const response = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ family_name, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signup failed');
        }

        const data = await response.json();
        setToken(data.token);
        setFamily(data.family);

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_family', JSON.stringify(data.family));

        return data;
    };

    const logout = () => {
        setToken(null);
        setFamily(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_family');
    };

    const value = {
        token,
        family,
        login,
        signup,
        logout,
        isAuthenticated: isMobile || !!token,
        loading,
        isMobile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
