import React from 'react';
import { User } from 'lucide-react';

const Avatar = ({ name, url, size = 40, className = '', ...props }) => {
    const initials = name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: url ? 'transparent' : 'hsl(var(--primary) / 0.2)',
                color: 'hsl(var(--primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: size * 0.4,
                overflow: 'hidden',
                border: '2px solid white',
                boxShadow: '0 0 0 2px hsl(var(--bg-surface))',
                ...props.style
            }}
            {...props}
        >
            {url ? (
                <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <User size={size * 0.6} strokeWidth={2} />
            )}
        </div>
    );
};

export default Avatar;
