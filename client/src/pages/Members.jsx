import React, { useEffect, useState } from 'react';
import { getMembers, createMember, deleteMember } from '../utils/api';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Input from '../components/Input';
import { Plus, Trash2, Trophy } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

const Members = () => {
    const { t } = useLanguage();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getMembers();
            setMembers(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            const added = await createMember({ name: newName });
            setMembers([...members, added]);
            setNewName('');
        } catch (err) {
            setError(t('addError'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('removeConfirm'))) return;
        try {
            await deleteMember(id);
            setMembers(members.filter(m => m.id !== id));
        } catch (err) {
            setError(t('deleteError'));
        }
    };

    if (loading) return <div>{t('loadingMembers')}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>{t('familyMembers')}</h2>

                {/* Simple Add Form inline for now */}
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ width: '200px' }}>
                        <Input
                            placeholder={t('name')}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            style={{ padding: '0.6rem', marginBottom: 0 }}
                        />
                    </div>
                    <Button type="submit">
                        <Plus size={18} /> {t('add')}
                    </Button>
                </form>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {members.map(member => (
                    <Card key={member.id} className="member-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Avatar name={member.name} url={member.avatar} size={50} />
                            <div>
                                <h3 style={{ fontSize: '1.1rem' }}>{member.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', fontWeight: 600, fontSize: '0.9rem' }}>
                                    <Trophy size={14} fill="#eab308" />
                                    <span>{member.total_points} pts</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                                onClick={() => handleDelete(member.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <Trash2 size={16} /> {t('remove')}
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {members.length === 0 && (
                <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '3rem' }}>
                    <p>{t('noMembers')}</p>
                </div>
            )}
        </div>
    );
};

export default Members;
