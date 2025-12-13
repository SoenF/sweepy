import React, { useEffect, useState } from 'react';
import { getChores, createChore, updateChore, deleteChore, getMembers, generateSchedule } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Legend from '../components/Legend';
import { Plus, Trash2, Repeat, BarChart2, Edit } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

const Chores = () => {
    const { t } = useLanguage();
    const [chores, setChores] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingChore, setEditingChore] = useState(null);
    const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        difficulty: 1,
        frequency_value: 1,
        frequency_type: 'days',
        auto_assign: true,
        assigned_members: [] // Will be populated with all member IDs by default
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [choresData, membersData] = await Promise.all([
                getChores(),
                getMembers()
            ]);
            setChores(choresData);
            setMembers(membersData);

            // Initialize assigned_members with all member IDs by default
            if (membersData.length > 0 && newItem.assigned_members.length === 0) {
                setNewItem(prev => ({
                    ...prev,
                    assigned_members: membersData.map(m => m.id)
                }));
            }
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
            setIsGeneratingSchedule(true);

            if (editingChore) {
                // Update existing chore
                const updated = await updateChore(editingChore.id, newItem);
                setChores(chores.map(c => c.id === editingChore.id ? updated : c));
                setEditingChore(null);
            } else {
                // Create new chore
                const added = await createChore(newItem);
                setChores([...chores, added]);
            }

            // Auto-generate schedule after create/update (30 days for better performance)
            await generateSchedule(30);

            // Reset form
            setNewItem({
                name: '',
                difficulty: 1,
                frequency_value: 1,
                frequency_type: 'days',
                auto_assign: true,
                assigned_members: members.map(m => m.id)
            });
        } catch (err) {
            setError(editingChore ? t('updateError') || 'Failed to update chore' : t('createError'));
        } finally {
            setIsGeneratingSchedule(false);
        }
    };

    const handleEdit = (chore) => {
        // First clear the form
        setNewItem({
            name: '',
            difficulty: 1,
            frequency_value: 1,
            frequency_type: 'days',
            auto_assign: true,
            assigned_members: []
        });

        // Then set the editing chore and populate with its data
        setEditingChore(chore);

        // Use setTimeout to ensure state updates in correct order
        setTimeout(() => {
            setNewItem({
                name: chore.name || '',
                difficulty: chore.difficulty || 1,
                frequency_value: chore.frequency_value || 1,
                frequency_type: chore.frequency_type || 'days',
                auto_assign: chore.auto_assign !== undefined ? chore.auto_assign : true,
                assigned_members: (chore.assigned_members && chore.assigned_members.length > 0)
                    ? chore.assigned_members
                    : members.map(m => m.id)
            });
        }, 0);
    };

    const handleCancelEdit = () => {
        setEditingChore(null);
        setNewItem({
            name: '',
            difficulty: 1,
            frequency_value: 1,
            frequency_type: 'days',
            auto_assign: true,
            assigned_members: members.map(m => m.id)
        });
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

            <div className="responsive-grid-sidebar">
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
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="ghost" onClick={() => handleEdit(chore)} style={{ color: 'hsl(var(--primary))' }}>
                                    <Edit size={18} />
                                </Button>
                                <Button variant="ghost" onClick={() => handleDelete(chore.id)} style={{ color: '#ef4444' }}>
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {chores.length === 0 && !loading && <p>{t('noChores')}</p>}
                </div>

                {/* Sidebar Form */}
                <Card style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1rem' }}>{editingChore ? t('editChore') : t('addNewChore')}</h3>
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

                        {/* Member Selection */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
                                {t('assignedMembers')}
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'hsl(var(--bg-body))', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                                {members.map(member => (
                                    <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={newItem.assigned_members.includes(member.id)}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setNewItem({ ...newItem, assigned_members: [...newItem.assigned_members, member.id] });
                                                } else {
                                                    setNewItem({ ...newItem, assigned_members: newItem.assigned_members.filter(id => id !== member.id) });
                                                }
                                            }}
                                        />
                                        {member.name}
                                    </label>
                                ))}
                                {members.length === 0 && <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>{t('noMembers') || 'Aucun membre disponible'}</p>}
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

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button type="submit" style={{ flex: 1 }} disabled={isGeneratingSchedule}>
                                {isGeneratingSchedule ? (
                                    <>{t('loading')}</>
                                ) : (
                                    <>
                                        <Plus size={18} /> {editingChore ? t('updateChore') : t('createChore')}
                                    </>
                                )}
                            </Button>
                            {editingChore && (
                                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                                    {t('cancel')}
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Chores;
