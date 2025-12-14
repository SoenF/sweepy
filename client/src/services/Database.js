import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

// Initialize the SQLite Connection
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db = null;

const createTables = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar TEXT,
        total_points INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS chores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        difficulty INTEGER DEFAULT 1,
        frequency_value INTEGER DEFAULT 1,
        frequency_type TEXT DEFAULT 'days',
        auto_assign INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chore_id INTEGER,
        member_id INTEGER,
        date TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (chore_id) REFERENCES chores(id),
        FOREIGN KEY (member_id) REFERENCES members(id)
    );
    `;
    await db.execute(query);
};

export const initDB = async () => {
    if (!Capacitor.isNativePlatform()) return; // Skip on web for now, unless we setup jeep-sqlite

    try {
        // Create or open DB
        db = await sqlite.createConnection('sweepy.db', false, 'no-encryption', 1, false);
        await db.open();
        await createTables();
        console.log('SQLite Database initialized');
    } catch (err) {
        console.error('Error initializing SQLite:', err);
    }
};

// --- Members ---
export const getLocalMembers = async () => {
    if (!db) return [];
    try {
        const res = await db.query('SELECT * FROM members ORDER BY total_points DESC');
        return res.values || [];
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const addLocalMember = async (member) => {
    if (!db) return null;
    try {
        const query = 'INSERT INTO members (name, avatar, total_points) VALUES (?, ?, ?)';
        const res = await db.run(query, [member.name, member.avatar || '', member.total_points || 0]);
        // Return constructed object with new ID
        return {
            id: res.changes.lastId,
            name: member.name,
            avatar: member.avatar || '',
            total_points: member.total_points || 0
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const deleteLocalMember = async (id) => {
    if (!db) return;
    try {
        await db.run('DELETE FROM members WHERE id = ?', [id]);
        await db.run('DELETE FROM assignments WHERE member_id = ?', [id]);
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const updateLocalMember = async (id, data) => {
    if (!db) return;
    try {
        // Build dynamic query or specific one. For simplicity assuming name/avatar update
        // Note: SQLite doesn't return the updated row, so we return the input data + id
        const query = 'UPDATE members SET name = ?, avatar = ? WHERE id = ?';
        await db.run(query, [data.name, data.avatar || '', id]);
        return { id, ...data };
    } catch (err) {
        console.error(err);
        throw err;
    }
};

// --- Chores ---
export const getLocalChores = async () => {
    if (!db) return [];
    try {
        const res = await db.query('SELECT * FROM chores');
        return res.values || [];
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const addLocalChore = async (chore) => {
    if (!db) return null;
    try {
        const query = 'INSERT INTO chores (name, difficulty, frequency_value, frequency_type, auto_assign) VALUES (?, ?, ?, ?, ?)';
        const res = await db.run(query, [
            chore.name,
            chore.difficulty || 1,
            chore.frequency_value || 1,
            chore.frequency_type || 'days',
            chore.auto_assign ? 1 : 0
        ]);
        return { ...chore, id: res.changes.lastId };
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const updateLocalChore = async (id, chore) => {
    if (!db) return;
    try {
        const query = 'UPDATE chores SET name = ?, difficulty = ?, frequency_value = ?, frequency_type = ?, auto_assign = ? WHERE id = ?';
        await db.run(query, [
            chore.name,
            chore.difficulty,
            chore.frequency_value,
            chore.frequency_type,
            chore.auto_assign ? 1 : 0,
            id
        ]);
        return { id, ...chore };
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const deleteLocalChore = async (id) => {
    if (!db) return;
    try {
        await db.run('DELETE FROM chores WHERE id = ?', [id]);
        await db.run('DELETE FROM assignments WHERE chore_id = ?', [id]);
    } catch (err) {
        console.error(err);
        throw err;
    }
};

// --- Assignments (Basic Placeholder) ---
import { format, addDays, addWeeks, addMonths, parseISO, isAfter, isSameDay } from 'date-fns';

// ... (previous imports and init)

// --- Assignments & Scheduling ---

export const getLocalAssignments = async (start, end) => {
    if (!db) return [];
    try {
        // Simple string comparison for dates works because format is YYYY-MM-DD
        const query = `
            SELECT a.id, a.date, a.status, a.chore_id, a.member_id,
                   c.name as chore_name, c.difficulty,
                   m.name as member_name, m.avatar, m.total_points
            FROM assignments a
            LEFT JOIN chores c ON a.chore_id = c.id
            LEFT JOIN members m ON a.member_id = m.id
            WHERE a.date >= ? AND a.date <= ?
            ORDER BY a.date ASC
        `;
        const res = await db.query(query, [start, end]);

        // Transform to match API format
        return (res.values || []).map(row => ({
            id: row.id,
            date: row.date,
            status: row.status,
            chore_id: row.chore_id,
            member_id: row.member_id,
            Chore: { id: row.chore_id, name: row.chore_name, difficulty: row.difficulty },
            Member: { id: row.member_id, name: row.member_name, avatar: row.avatar, total_points: row.total_points }
        }));
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const toggleLocalTask = async (id, memberId = null) => {
    if (!db) return;
    try {
        // 1. Get current status
        const res = await db.query('SELECT * FROM assignments WHERE id = ?', [id]);
        if (!res.values.length) return;
        const task = res.values[0];

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        // 2. Update status
        await db.run('UPDATE assignments SET status = ? WHERE id = ?', [newStatus, id]);

        // 3. Update Points
        const choreRes = await db.query('SELECT difficulty FROM chores WHERE id = ?', [task.chore_id]);
        const points = choreRes.values[0]?.difficulty || 1;
        const targetMemberId = memberId || task.member_id;

        if (newStatus === 'completed') {
            await db.run('UPDATE members SET total_points = total_points + ? WHERE id = ?', [points, targetMemberId]);
        } else {
            await db.run('UPDATE members SET total_points = total_points - ? WHERE id = ?', [points, targetMemberId]);
        }

    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const generateLocalSchedule = async (days = 30) => {
    if (!db) return;
    try {
        const chores = (await db.query('SELECT * FROM chores WHERE auto_assign = 1')).values || [];
        const members = (await db.query('SELECT * FROM members')).values || [];

        if (!chores.length || !members.length) return;

        const today = new Date();
        const endDate = addDays(today, days);
        const todayStr = format(today, 'yyyy-MM-dd');

        for (const chore of chores) {
            // 1. Clear future pending
            await db.run('DELETE FROM assignments WHERE chore_id = ? AND date > ? AND status = ?', [chore.id, todayStr, 'pending']);

            // 2. Find last date
            const lastRes = await db.query('SELECT date FROM assignments WHERE chore_id = ? ORDER BY date DESC LIMIT 1', [chore.id]);
            let nextDate = new Date();

            if (lastRes.values.length > 0) {
                const lastDate = parseISO(lastRes.values[0].date);
                nextDate = calculateNextDate(lastDate, chore.frequency_value, chore.frequency_type);
                if (nextDate <= today) nextDate = addDays(today, 1);
            }

            // 3. Generate
            while (nextDate <= endDate) {
                const dateStr = format(nextDate, 'yyyy-MM-dd');

                // Check dupes
                const exists = await db.query('SELECT id FROM assignments WHERE chore_id = ? AND date = ?', [chore.id, dateStr]);
                if (exists.values.length === 0) {
                    // Pick Member (Simple Round Robin or Random)
                    // For improved consistency, pick member with FEWEST assignments in general, or simplified round robin based on day?
                    // Let's use simple random for now to match simplicity requirement, or modulo date
                    const memberIndex = Math.floor(Math.random() * members.length);
                    const member = members[memberIndex];

                    await db.run('INSERT INTO assignments (chore_id, member_id, date, status) VALUES (?, ?, ?, ?)',
                        [chore.id, member.id, dateStr, 'pending']);
                }

                nextDate = calculateNextDate(nextDate, chore.frequency_value, chore.frequency_type);
            }
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
};

function calculateNextDate(currentDate, value, type) {
    if (type === 'weeks') return addWeeks(currentDate, value);
    if (type === 'months') return addMonths(currentDate, value);
    return addDays(currentDate, value);
}

// ===== SYNC QUEUE Functions =====

// Create sync_queue table if needed
const createSyncQueueTable = async () => {
    if (!db) return;
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        `;
        await db.execute(query);
    } catch (err) {
        console.error('Error creating sync_queue table:', err);
    }
};

// Initialize sync queue table when DB is initialized
if (Capacitor.isNativePlatform()) {
    initDB().then(() => createSyncQueueTable());
}

export const addToSyncQueue = async (change) => {
    if (!db) return;
    try {
        const query = 'INSERT INTO sync_queue (type, data) VALUES (?, ?)';
        await db.run(query, [change.type, JSON.stringify(change.data)]);
    } catch (err) {
        console.error('Error adding to sync queue:', err);
        throw err;
    }
};

export const getSyncQueue = async () => {
    if (!db) return [];
    try {
        const res = await db.query('SELECT * FROM sync_queue ORDER BY id ASC');
        return (res.values || []).map(row => ({
            id: row.id,
            type: row.type,
            data: JSON.parse(row.data)
        }));
    } catch (err) {
        console.error('Error getting sync queue:', err);
        return [];
    }
};

export const clearSyncQueue = async (ids) => {
    if (!db || !ids || ids.length === 0) return;
    try {
        const placeholders = ids.map(() => '?').join(',');
        const query = `DELETE FROM sync_queue WHERE id IN (${placeholders})`;
        await db.run(query, ids);
    } catch (err) {
        console.error('Error clearing sync queue:', err);
        throw err;
    }
};

// ===== BATCH UPSERT Functions =====

export const upsertBatchMembers = async (members) => {
    if (!db || !members || members.length === 0) return;
    try {
        // First, get current local members to identify which ones are locally created (no server id yet)
        const currentLocalMembers = await getLocalMembers();
        const localOnlyMembers = currentLocalMembers.filter(localMember =>
            !members.some(serverMember => serverMember.id === localMember.id)
        );

        // Use INSERT OR REPLACE to merge server data
        for (const member of members) {
            const query = 'INSERT OR REPLACE INTO members (id, name, avatar, total_points) VALUES (?, ?, ?, ?)';
            await db.run(query, [
                member.id || member._id,
                member.name,
                member.avatar || '',
                member.total_points || 0
            ]);
        }

        // Re-insert local-only members to preserve them
        for (const localMember of localOnlyMembers) {
            if (!members.some(serverMember => serverMember.id === localMember.id)) {
                const query = 'INSERT OR REPLACE INTO members (id, name, avatar, total_points) VALUES (?, ?, ?, ?)';
                await db.run(query, [
                    localMember.id,
                    localMember.name,
                    localMember.avatar || '',
                    localMember.total_points
                ]);
            }
        }

        console.log(`[DB] Upserted ${members.length} members from server, preserved ${localOnlyMembers.length} local-only members`);
    } catch (err) {
        console.error('Error upserting batch members:', err);
        throw err;
    }
};

export const upsertBatchChores = async (chores) => {
    if (!db || !chores || chores.length === 0) return;
    try {
        // First, get current local chores to identify which ones are locally created (no server id yet)
        const currentLocalChores = await getLocalChores();
        const localOnlyChores = currentLocalChores.filter(localChore =>
            !chores.some(serverChore => serverChore.id === localChore.id)
        );

        // Use INSERT OR REPLACE to merge server data
        for (const chore of chores) {
            const query = 'INSERT OR REPLACE INTO chores (id, name, difficulty, frequency_value, frequency_type, auto_assign) VALUES (?, ?, ?, ?, ?, ?)';
            await db.run(query, [
                chore.id || chore._id,
                chore.name,
                chore.difficulty || 1,
                chore.frequency_value || 1,
                chore.frequency_type || 'days',
                chore.auto_assign ? 1 : 0
            ]);
        }

        // Re-insert local-only chores to preserve them
        for (const localChore of localOnlyChores) {
            if (!chores.some(serverChore => serverChore.id === localChore.id)) {
                const query = 'INSERT OR REPLACE INTO chores (id, name, difficulty, frequency_value, frequency_type, auto_assign) VALUES (?, ?, ?, ?, ?, ?)';
                await db.run(query, [
                    localChore.id,
                    localChore.name,
                    localChore.difficulty || 1,
                    localChore.frequency_value || 1,
                    localChore.frequency_type || 'days',
                    localChore.auto_assign ? 1 : 0
                ]);
            }
        }

        console.log(`[DB] Upserted ${chores.length} chores from server, preserved ${localOnlyChores.length} local-only chores`);
    } catch (err) {
        console.error('Error upserting batch chores:', err);
        throw err;
    }
};

