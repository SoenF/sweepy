import React from 'react';
import '../index.css';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`card ${className}`}
            style={{
                backgroundColor: 'hsl(var(--bg-surface))',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                ...props.style
            }}
            onMouseEnter={(e) => {
                if (props.hoverable) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }
            }}
            onMouseLeave={(e) => {
                if (props.hoverable) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
