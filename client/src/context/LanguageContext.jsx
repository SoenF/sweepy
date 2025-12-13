import React, { createContext, useContext, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default to French for all platforms
    const [language, setLanguage] = useState('fr');

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
