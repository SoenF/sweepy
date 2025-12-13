const API_URL = 'http://localhost:3000/api';

// Members
export const getMembers = async () => {
    const res = await fetch(`${API_URL}/members`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
};

export const createMember = async (data) => {
    const res = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create member');
    return res.json();
};

export const deleteMember = async (id) => {
    const res = await fetch(`${API_URL}/members/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete member');
    return res.json();
};

export const resetPoints = async () => {
    const res = await fetch(`${API_URL}/members/points/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset points');
    return res.json();
};

// Chores
export const getChores = async () => {
    const res = await fetch(`${API_URL}/chores`);
    if (!res.ok) throw new Error('Failed to fetch chores');
    return res.json();
};

export const createChore = async (data) => {
    const res = await fetch(`${API_URL}/chores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create chore');
    return res.json();
};

export const deleteChore = async (id) => {
    const res = await fetch(`${API_URL}/chores/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete chore');
    return res.json();
};

// Schedule
export const getAssignments = async (start, end) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);

    const res = await fetch(`${API_URL}/schedule?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch assignments');
    return res.json();
};

export const generateSchedule = async (days = 30) => {
    const res = await fetch(`${API_URL}/schedule/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
    });
    if (!res.ok) throw new Error('Failed to generate schedule');
    return res.json();
};

export const toggleTask = async (id, memberId = null) => {
    const res = await fetch(`${API_URL}/schedule/${id}/toggle`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ member_id: memberId })
    });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
};
