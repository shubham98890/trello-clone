const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ DATABASE
const dbFile = path.join(__dirname, 'trello.db');
const db = new sqlite3.Database(dbFile);

const setupDB = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        position INTEGER NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        listId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        labels TEXT,
        dueDate TEXT,
        position INTEGER NOT NULL,
        FOREIGN KEY(listId) REFERENCES lists(id) ON DELETE CASCADE
      )
    `);

    db.run(`ALTER TABLE cards ADD COLUMN labels TEXT`, [], () => {});
    db.run(`ALTER TABLE cards ADD COLUMN dueDate TEXT`, [], () => {});
  });
};

setupDB();

// ✅ UTILS
const generateId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

// ✅ GET BOARD DATA
const getBoardData = async () => {
  const lists = await queryAsync(
    'SELECT id, title FROM lists ORDER BY position'
  );

  for (const list of lists) {
    const cards = await queryAsync(
      'SELECT id, title, description, labels, dueDate FROM cards WHERE listId = ? ORDER BY position',
      [list.id]
    );

    list.cards = cards.map((card) => ({
      ...card,
      labels: card.labels ? JSON.parse(card.labels) : [],
      dueDate: card.dueDate || '',
    }));
  }

  return { id: 'board-1', title: 'Main Kanban Board', lists };
};

// ✅ AI FALLBACK
const generateAIDueDate = (keywords) => {
  const today = new Date();

  if (keywords.includes('urgent') || keywords.includes('asap')) {
    return new Date(today.getTime() + 86400000)
      .toISOString()
      .split('T')[0];
  }

  if (keywords.includes('tomorrow')) {
    return new Date(today.getTime() + 86400000)
      .toISOString()
      .split('T')[0];
  }

  if (keywords.includes('this week') || keywords.includes('soon')) {
    return new Date(today.getTime() + 3 * 86400000)
      .toISOString()
      .split('T')[0];
  }

  return '';
};

const generateAISuggestion = (prompt) => {
  const normalized = (prompt || '').trim();
  const keywords = normalized.toLowerCase();

  const title =
    normalized.split(/[\s.?!]+/).slice(0, 6).join(' ') ||
    'New AI task';

  const labelSet = [
    'bug',
    'feature',
    'research',
    'design',
    'urgent',
    'backend',
    'frontend',
  ];

  const labels = labelSet.filter((l) =>
    keywords.includes(l)
  );

  return {
    title,
    description: `Suggested by AI: "${normalized}"`,
    labels: labels.length ? labels : ['smart'],
    dueDate: generateAIDueDate(keywords),
  };
};

// ✅ AI ROUTE
app.post('/ai/suggest-card', (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  res.json(generateAISuggestion(prompt));
});

// ✅ SEED DATA
const seedDefaultData = async () => {
  const rows = await queryAsync(
    'SELECT COUNT(*) AS cnt FROM lists'
  );

  if (rows[0].cnt === 0) {
    await runAsync(
      'INSERT INTO lists(id,title,position) VALUES (?,?,?)',
      ['list-1', 'To Do', 1]
    );
  }
};

seedDefaultData();

// ✅ ROUTES
app.get('/board', async (req, res) => {
  const board = await getBoardData();
  res.json(board);
});

app.post('/list', async (req, res) => {
  const { title } = req.body;

  const row = await queryAsync(
    'SELECT COALESCE(MAX(position),0)+1 AS pos FROM lists'
  );

  const id = generateId('list');

  await runAsync(
    'INSERT INTO lists(id,title,position) VALUES (?,?,?)',
    [id, title, row[0].pos]
  );

  res.json({ id, title, cards: [] });
});

// ✅ ROOT ROUTE (IMPORTANT)
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// ✅ START SERVER
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});