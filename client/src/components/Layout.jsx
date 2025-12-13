import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Calendar as CalendarIcon, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { t, language, toggleLanguage } = useLanguage();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: t('dashboard') },
        { path: '/members', icon: Users, label: t('members') },
        { path: '/chores', icon: CheckSquare, label: t('chores') },
        { path: '/calendar', icon: CalendarIcon, label: t('calendar') },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            {/* Sidebar - Desktop Only */}
            <aside className="desktop-sidebar" style={{
                width: '260px',
                backgroundColor: 'hsl(var(--bg-body))',
                borderRight: '1px solid rgba(0,0,0,0.05)',
                padding: '2rem 1.5rem',
                position: 'fixed',
                height: '100vh',
                left: 0,
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50
            }}>
                {/* ... Sidebar Content ... */}
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                    <div style={{
                        width: 40, height: 40,
                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                        borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}>
                        <CheckSquare size={22} strokeWidth={2.5} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Sweepy</h1>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                                    color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                                    backgroundColor: isActive ? 'white' : 'transparent',
                                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'all 0.2s', fontSize: '0.95rem'
                                }}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.7 }} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <button
                    onClick={toggleLanguage}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        backgroundColor: 'white',
                        color: 'hsl(var(--text-main))',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        marginTop: 'auto',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s'
                    }}
                >
                    <Globe size={18} />
                    {language === 'en' ? 'Français' : 'English'}
                </button>
            </aside>

            {/* Bottom Navigation - Mobile Only */}
            <nav className="mobile-bottom-nav" style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                padding: '0.75rem 0.5rem',
                zIndex: 100,
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
            }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                                flex: 1,
                                fontSize: '0.75rem',
                                fontWeight: isActive ? 600 : 500
                            }}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Main Content */}
            <main className="main-content" style={{
                flex: 1,
                padding: '2rem',
                maxWidth: '100%'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
