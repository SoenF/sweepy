import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = {
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'center'
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
