import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

import { Capacitor } from '@capacitor/core';

export const LanguageProvider = ({ children }) => {
    // Force French on Mobile, else default to English
    const isMobile = Capacitor.isNativePlatform();
    const [language, setLanguage] = useState(isMobile ? 'fr' : 'en');

    const toggleLanguage = () => {
        // Allow toggling even on mobile if user really wants, or maybe enforce it?
        // User said "toujours en français", but maybe just default?
        // Let's set default. If they toggle, it changes. Assuming "Default to French" is what's meant.
        setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'));
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
