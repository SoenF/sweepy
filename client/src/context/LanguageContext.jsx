import React, { createContext, useContext, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Force French on Mobile, else default to English
    const isMobile = Capacitor.isNativePlatform();
    // Default language logic
    const [language, setLanguage] = useState(isMobile ? 'fr' : 'en');

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'));
    };

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
