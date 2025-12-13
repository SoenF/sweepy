import React, { useEffect, useState } from 'react';
import { getChores, createChore, deleteChore } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Plus, Trash2, Repeat, BarChart2 } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

const Chores = () => {
    const { t } = useLanguage();
    const [chores, setChores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        difficulty: 1,
        frequency_value: 1,
        frequency_type: 'days',
        auto_assign: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getChores();
            setChores(data);
        } catch (err) {
            setError(t('fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        try {
            const added = await createChore(newItem);
            setChores([...chores, added]);
            setNewItem({
                name: '',
                difficulty: 1,
                frequency_value: 1,
                frequency_type: 'days',
                auto_assign: true
            });
        } catch (err) {
            setError(t('createError'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('deleteChoreConfirm'))) return;
        try {
            await deleteChore(id);
            setChores(chores.filter(c => c.id !== id));
        } catch (err) {
            setError(t('deleteError'));
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2>{t('choresTitle')}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading && <p>{t('loading')}</p>}
                    {chores.map(chore => (
                        <Card key={chore.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{chore.name}</h3>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <BarChart2 size={14} /> {t('level')} {chore.difficulty}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Repeat size={14} /> {t('every')} {chore.frequency_value} {t(chore.frequency_type)}
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => handleDelete(chore.id)} style={{ color: '#ef4444' }}>
                                <Trash2 size={18} />
                            </Button>
                        </Card>
                    ))}
                    {chores.length === 0 && !loading && <p>{t('noChores')}</p>}
                </div>

                {/* Sidebar Form */}
                <Card style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1rem' }}>{t('addNewChore')}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input
                            label={t('choreName')}
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            required
                        />

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>{t('difficulty')}</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[1, 2, 3].map(lvl => (
                                    <button
                                        type="button"
                                        key={lvl}
                                        onClick={() => setNewItem({ ...newItem, difficulty: lvl })}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: `1px solid ${newItem.difficulty === lvl ? 'hsl(var(--primary))' : '#e2e8f0'}`,
                                            backgroundColor: newItem.difficulty === lvl ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                            color: newItem.difficulty === lvl ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label={t('every')}
                                    type="number"
                                    min="1"
                                    value={newItem.frequency_value}
                                    onChange={e => setNewItem({ ...newItem, frequency_value: parseInt(e.target.value) })}
                                />
                            </div>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>{t('unit')}</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}
                                    value={newItem.frequency_type}
                                    onChange={e => setNewItem({ ...newItem, frequency_type: e.target.value })}
                                >
                                    <option value="days">{t('days')}</option>
                                    <option value="weeks">{t('weeks')}</option>
                                    <option value="months">{t('months')}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={newItem.auto_assign}
                                    onChange={e => setNewItem({ ...newItem, auto_assign: e.target.checked })}
                                />
                                {t('autoAssign')}
                            </label>
                        </div>

                        <Button type="submit" style={{ marginTop: '0.5rem' }}>
                            <Plus size={18} /> {t('createChore')}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Chores;
