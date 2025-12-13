import React from 'react';

const Input = ({ label, error, ...props }) => {
    return (
        <div style={{ marginBottom: '1rem', width: '100%' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'hsl(var(--text-muted))'
                }}>
                    {label}
                </label>
            )}
            <input
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'hsl(var(--bg-surface))',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    ...(error ? { borderColor: '#ef4444' } : {})
                }}
                {...props}
            />
            {error && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</span>}
        </div>
    );
};

export default Input;
