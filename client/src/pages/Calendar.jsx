import React, { useEffect, useState } from 'react';
import { getAssignments, generateSchedule, toggleTask } from '../utils/api';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

const Calendar = () => {
    const { t } = useLanguage();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, [currentDate]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const start = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
            const end = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');
            const data = await getAssignments(start, end);
            setAssignments(data);
        } catch (err) {
            console.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            await generateSchedule(365);
            fetchAssignments(); // Refresh
        } catch (err) {
            alert('Failed to generate schedule');
        }
    };

    const handleToggle = async (assignment) => {
        try {
            await toggleTask(assignment.id);
            fetchAssignments(); // Refresh to see crossed out status
        } catch (err) {
            alert('Failed to update task');
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayAssignments = (day) => {
        // Parse assignment date as local date to ensure match
        return assignments.filter(a => {
            if (!a.date) return false;
            // Split "YYYY-MM-DD" and create local date (Month is 0-indexed)
            const [y, m, d] = a.date.split('-').map(Number);
            const assignDate = new Date(y, m - 1, d);

            // Filter out orphans (no member attached OR no chore attached)
            if (!a.Member || !a.Chore) return false;

            return isSameDay(assignDate, day);
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={prevMonth}><ChevronLeft /></Button>
                    <h2 style={{ minWidth: '200px', textAlign: 'center' }}>{format(currentDate, 'MMMM yyyy')}</h2>
                    <Button variant="ghost" onClick={nextMonth}><ChevronRight /></Button>
                </div>

                <Button onClick={handleGenerate} variant="secondary">
                    <RefreshCw size={18} /> {t('autoGenerate')}
                </Button>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {/* Days Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {dateRange.map(day => {
                        const dayAssignments = getDayAssignments(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);

                        return (
                            <div
                                key={day.toString()}
                                style={{
                                    minHeight: '120px',
                                    padding: '0.5rem',
                                    borderRight: '1px solid #f1f5f9',
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor: isCurrentMonth ? 'white' : '#f8fafc',
                                    opacity: isCurrentMonth ? 1 : 0.6
                                }}
                            >
                                <div style={{ marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: isSameDay(day, new Date()) ? 'hsl(var(--primary))' : 'inherit' }}>
                                    {format(day, 'd')}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {dayAssignments.map(assignment => (
                                        <div
                                            key={assignment.id}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: assignment.status === 'completed' ? '#dcfce7' : 'hsl(var(--primary) / 0.1)',
                                                color: assignment.status === 'completed' ? '#166534' : 'hsl(var(--primary-dark))',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                cursor: 'pointer',
                                                textDecoration: assignment.status === 'completed' ? 'line-through' : 'none'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggle(assignment);
                                            }}
                                            title="Click to toggle completion"
                                        >
                                            {assignment.status === 'completed' && <CheckCircle size={10} />}
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                                                {assignment.Member?.name}
                                            </span>
                                            <span style={{ opacity: 0.8 }}>: {assignment.Chore?.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default Calendar;
