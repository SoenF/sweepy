import React, { useEffect, useState } from 'react';
import { getAssignments, generateSchedule, toggleTask, getMembers } from '../utils/api';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Legend from '../components/Legend';
import { getMemberColor } from '../utils/colors';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Calendar = () => {
    const { t, language } = useLanguage();
    const dateLocale = language === 'fr' ? fr : enUS;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignments, setAssignments] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const start = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
            const end = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');

            const [assigns, mems] = await Promise.all([
                getAssignments(start, end),
                getMembers()
            ]);

            setAssignments(assigns);
            setMembers(mems);
        } catch (err) {
            console.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            await generateSchedule(365);
            fetchData();
        } catch (err) {
            alert('Failed to generate schedule');
        }
    };

    const handleToggle = async (assignment) => {
        try {
            await toggleTask(assignment.id);
            fetchData();
        } catch (err) {
            alert('Failed to update task');
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayAssignments = (day) => {
        return assignments.filter(a => {
            if (!a.date) return false;
            const [y, m, d] = a.date.split('-').map(Number);
            const assignDate = new Date(y, m - 1, d);
            if (!a.Member || !a.Chore) return false;
            return isSameDay(assignDate, day);
        });
    };

    const handleDayClick = (day) => {
        setSelectedDate(day);
    };

    const selectedDayAssignments = getDayAssignments(selectedDate);

    return (
        <div>
            <div className="page-header-responsive" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                    <Button variant="ghost" onClick={prevMonth}><ChevronLeft /></Button>
                    <h2 style={{ textAlign: 'center', flex: 1, minWidth: '150px' }} className="capitalize-first">
                        {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
                    </h2>
                    <Button variant="ghost" onClick={nextMonth}><ChevronRight /></Button>
                </div>

                <Button
                    onClick={handleGenerate}
                    variant="secondary"
                    className="mobile-full-width"
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <RefreshCw size={18} /> Mettre à jour
                </Button>
            </div>

            {/* Legend Section */}
            <div style={{ marginBottom: '1rem' }}>
                <Legend members={members} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Days Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                            <div key={i} style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                                {day.substring(0, 3)}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {dateRange.map((day, idx) => {
                            const dayAssignments = getDayAssignments(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => handleDayClick(day)}
                                    className={isSelected ? 'calendar-day-selected' : ''}
                                    style={{
                                        minHeight: '80px',
                                        padding: '0.25rem',
                                        borderRight: '1px solid #f1f5f9',
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: isCurrentMonth ? 'white' : '#f8fafc',
                                        opacity: isCurrentMonth ? 1 : 0.6,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        width: '24px', height: '24px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '0.25rem',
                                        borderRadius: '50%',
                                        backgroundColor: isToday ? 'hsl(var(--primary))' : 'transparent',
                                        color: isToday ? 'white' : 'inherit'
                                    }}>
                                        {format(day, 'd')}
                                    </div>

                                    {/* Desktop View: Full Text */}
                                    <div className="calendar-cell-content" style={{ width: '100%' }}>
                                        {dayAssignments.map(assignment => {
                                            const memberColor = getMemberColor(assignment.Member?.name);
                                            return (
                                                <div
                                                    key={assignment.id}
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 4px',
                                                        backgroundColor: assignment.status === 'completed' ? '#dcfce7' : `${memberColor}20`,
                                                        color: assignment.status === 'completed' ? '#166534' : 'hsl(var(--text-main))',
                                                        borderLeft: assignment.status === 'completed' ? 'none' : `3px solid ${memberColor}`,
                                                        borderRadius: '4px',
                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {assignment.Member?.name}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Mobile View: Dots */}
                                    <div className="calendar-dots-container">
                                        {dayAssignments.map(assignment => (
                                            <div
                                                key={assignment.id}
                                                className="calendar-dot"
                                                style={{
                                                    backgroundColor: assignment.status === 'completed'
                                                        ? '#22c55e'
                                                        : getMemberColor(assignment.Member?.name)
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Selected Day Details */}
                <div style={{ paddingBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }} className="capitalize-first">
                        {format(selectedDate, 'EEEE d MMMM', { locale: dateLocale })}
                    </h3>

                    {selectedDayAssignments.length === 0 ? (
                        <p style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>{t('noChores') || "No chores for this day."}</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {selectedDayAssignments.map(assignment => {
                                const memberColor = getMemberColor(assignment.Member?.name);
                                return (
                                    <Card
                                        key={assignment.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '1rem',
                                            borderLeft: `4px solid ${assignment.status === 'completed' ? '#22c55e' : memberColor}`
                                        }}
                                        onClick={() => handleToggle(assignment)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ color: assignment.status === 'completed' ? '#22c55e' : '#cbd5e1' }}>
                                                <CheckCircle size={24} fill={assignment.status === 'completed' ? 'currentColor' : 'none'} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, textDecoration: assignment.status === 'completed' ? 'line-through' : 'none' }}>
                                                    {assignment.Chore?.name}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Avatar name={assignment.Member?.name} url={assignment.Member?.avatar} size={20} />
                                                    {assignment.Member?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem', fontWeight: 700,
                                            backgroundColor: 'hsl(var(--bg-body))', padding: '0.25rem 0.5rem', borderRadius: '12px',
                                            color: 'hsl(var(--text-muted))'
                                        }}>
                                            {assignment.Chore?.difficulty || 1} pts
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
