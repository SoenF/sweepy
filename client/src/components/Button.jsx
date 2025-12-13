import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = {
        padding: '0.75rem 1.5rem',
        borderRadius: '9999px', // Pill shape looks more "app-like" and premium
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
        fontSize: '0.95rem',
        active: { transform: 'scale(0.98)' } // Note: inline styles don't support pseudo-classes directly without state, but I'll leave this to CSS if possible.
    };

    const variants = {
        primary: {
            backgroundColor: 'hsl(var(--primary))',
            color: 'white',
        },
        secondary: {
            backgroundColor: 'hsl(var(--secondary))',
            color: 'white',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'hsl(var(--text-muted))',
            boxShadow: 'none'
        },
        danger: {
            backgroundColor: '#ef4444', // Red-500
            color: 'white'
        }
    };

    return (
        <button
            className={className}
            style={{ ...baseStyle, ...variants[variant] }}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
