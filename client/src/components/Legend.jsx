import React from 'react';
import { getMemberColor } from '../utils/colors';
import { useLanguage } from '../context/LanguageContext';

const Legend = ({ members }) => {
    const { t } = useLanguage();

    if (!members || members.length === 0) return null;

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            marginTop: '1rem' // Space above
        }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginRight: '0.5rem' }}>
                {t('legend')}:
            </span>
            {members.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: getMemberColor(member.name)
                    }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{member.name}</span>
                </div>
            ))}
        </div>
    );
};

export default Legend;
