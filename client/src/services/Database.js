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
export const getLocalAssignments = async (start, end) => {
    // For now returning empty or simple logic.
    // The user didn't ask for full scheduling logic ON MOBILE yet, just "adding, editing tasks/members".
    // We can list basic assignments if we insert them manually? 
    // Or just return empty to prevent errors on the Scheduler page.
    if (!db) return [];
    // Maybe query by date if we stored it
    return [];
};
