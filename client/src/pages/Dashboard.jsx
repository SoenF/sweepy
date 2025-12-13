import React, { useEffect, useState } from 'react';
import { getMembers, getAssignments, resetPoints } from '../utils/api';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { CheckCircle, Trophy, Calendar, RefreshCcw } from 'lucide-react';
import Button from '../components/Button';

import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
    const { t, language } = useLanguage();
    const [members, setMembers] = useState([]);
    const [todaysChores, setTodaysChores] = useState([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();

    // Map string language to date-fns locale
    const dateLocale = language === 'fr' ? fr : enUS;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const todayStr = format(today, 'yyyy-MM-dd');
            const [mems, assigns] = await Promise.all([
                getMembers(),
                getAssignments(todayStr, todayStr)
            ]);

            // Sort members by points
            setMembers(mems.sort((a, b) => b.total_points - a.total_points));

            // Filter out orphans
            const validAssigns = assigns.filter(a => a.Member && a.Chore);
            setTodaysChores(validAssigns);
        } catch (e) {
            console.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };
    const handleResetPoints = async () => {
        if (!confirm(t('resetConfirm'))) return;
        try {
            await resetPoints();
            loadData();
        } catch (err) {
            alert('Failed to reset points');
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{t('welcome')}</h2>
                <p style={{ color: 'hsl(var(--text-muted))' }}>
                    {language === 'fr' ? "C'est " : "It's "}
                    {format(today, 'EEEE d MMMM yyyy', { locale: dateLocale })}
                </p>
            </div>

            <div className="dashboard-grid">
                {/* Today's Chores - ONLY SHOW IF THERE ARE CHORES */}
                {todaysChores.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={20} /> {t('todaysChores')}
                        </h3>

                        {loading ? <p>{t('loading')}</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {todaysChores.map(chore => (
                                    <Card key={chore.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: 40, height: 40,
                                                borderRadius: '50%',
                                                backgroundColor: chore.status === 'completed' ? '#dcfce7' : 'hsl(var(--primary) / 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: chore.status === 'completed' ? '#166534' : 'hsl(var(--primary))'
                                            }}>
                                                {chore.status === 'completed' ? <CheckCircle size={20} /> : <div style={{ width: 16, height: 16, border: '2px solid currentColor', borderRadius: '50%' }} />}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1.1rem', textDecoration: chore.status === 'completed' ? 'line-through' : 'none', color: chore.status === 'completed' ? 'hsl(var(--text-muted))' : 'inherit' }}>
                                                    {chore.Chore?.name}
                                                </h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
                                                    <span>{t('assignedTo')}</span>
                                                    <Avatar name={chore.Member?.name} url={chore.Member?.avatar} size={20} />
                                                    <span>{chore.Member?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Actions could go assigned here */}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard */}
                <div>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Trophy size={20} color="#eab308" /> {t('leaderboard')}
                        </h3>
                        <Button variant="ghost" size="sm" onClick={handleResetPoints} title="Reset all points">
                            <RefreshCcw size={16} />
                        </Button>
                    </div>

                    {/* PODIUM */}
                    {members.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '2rem', height: '180px' }}>
                            {/* 2nd Place (Left) */}
                            {members[1] && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                                    <Avatar name={members[1].name} url={members[1].avatar} size={50} style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.25rem' }}>{members[1].name}</div>
                                    <div style={{
                                        width: '100%', height: '80px',
                                        background: 'linear-gradient(to bottom, #E0E0E0, #C0C0C0)',
                                        borderRadius: '8px 8px 0 0',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        color: '#555', fontWeight: 'bold'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>2</span>
                                        <span style={{ fontSize: '0.8rem' }}>{members[1].total_points} pts</span>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place (Center - Tallest) */}
                            {members[0] && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', zIndex: 1 }}>
                                    <Avatar name={members[0].name} url={members[0].avatar} size={70} style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'center', marginBottom: '0.25rem' }}>{members[0].name}</div>
                                    <div style={{
                                        width: '100%', height: '110px',
                                        background: 'linear-gradient(to bottom, #FCD34D, #F59E0B)',
                                        borderRadius: '8px 8px 0 0',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        color: '#78350F', fontWeight: 'bold',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        <span style={{ fontSize: '1.5rem' }}>1</span>
                                        <span style={{ fontSize: '0.9rem' }}>{members[0].total_points} pts</span>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place (Right) */}
                            {members[2] && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                                    <Avatar name={members[2].name} url={members[2].avatar} size={50} style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.25rem' }}>{members[2].name}</div>
                                    <div style={{
                                        width: '100%', height: '60px',
                                        background: 'linear-gradient(to bottom, #FDBA74, #CD7F32)',
                                        borderRadius: '8px 8px 0 0',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        color: '#7C2D12', fontWeight: 'bold'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>3</span>
                                        <span style={{ fontSize: '0.8rem' }}>{members[2].total_points} pts</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {members.length > 3 && (
                        <Card style={{ padding: 0, overflow: 'hidden' }}>
                            {members.slice(3).map((member, index) => (
                                <div
                                    key={member.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        borderBottom: index < members.length - 4 ? '1px solid #f1f5f9' : 'none',
                                    }}
                                >
                                    <div style={{ width: '30px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                                        #{index + 4}
                                    </div>
                                    <Avatar name={member.name} url={member.avatar} size={36} />
                                    <div style={{ marginLeft: '0.75rem', flex: 1, fontWeight: 500 }}>
                                        {member.name}
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                                        {member.total_points}
                                    </div>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
