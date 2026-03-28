const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

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

    // ensure columns exist for upgrades
    db.run(`ALTER TABLE cards ADD COLUMN labels TEXT`, [], () => {});
    db.run(`ALTER TABLE cards ADD COLUMN dueDate TEXT`, [], () => {});
  });
};

setupDB();

const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ id: this.lastID, changes: this.changes });
  });
});

const getBoardData = async () => {
  const lists = await queryAsync('SELECT id, title FROM lists ORDER BY position');
  for (const list of lists) {
    const cards = await queryAsync('SELECT id, title, description, labels, dueDate FROM cards WHERE listId = ? ORDER BY position', [list.id]);
    list.cards = cards.map((card) => ({
      ...card,
      labels: card.labels ? JSON.parse(card.labels) : [],
      dueDate: card.dueDate || '',
    }));
  }
  return { id: 'board-1', title: 'Main Kanban Board', lists };
};

const generateAIDueDate = (keywords) => {
  const today = new Date();
  if (keywords.includes('urgent') || keywords.includes('asap')) {
    return new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  if (keywords.includes('tomorrow')) {
    return new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  if (keywords.includes('this week') || keywords.includes('within a week') || keywords.includes('soon')) {
    return new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  return '';
};

const generateAISuggestion = (prompt) => {
  const normalized = (prompt || '').trim();
  const keywords = normalized.toLowerCase();
  const rawTitle = normalized.split(/[\s.?!]+/).slice(0, 6).join(' ');
  const title = rawTitle ? `${rawTitle}` : 'New AI task';

  const labelSet = ['bug', 'feature', 'research', 'design', 'urgent', 'backend', 'frontend', 'improvement', 'test', 'docs'];
  const labels = labelSet.filter((label) => keywords.includes(label)).slice(0, 3);

  return {
    title,
    description: `Suggested by AI assistant based on input: "${normalized}". Clear goals, steps, and acceptance criteria help the team execute this task.`,
    labels: labels.length ? labels : ['smart'],
    dueDate: generateAIDueDate(keywords),
  };
};

app.post('/ai/suggest-card', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt text is required' });
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful Trello-like board assistant that suggests task cards with title, description, labels and dueDate.' },
            { role: 'user', content: `Create a JSON suggestion for the task:
prompt: "${prompt}"` },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      const openaiData = await openaiResp.json();
      const content = openaiData?.choices?.[0]?.message?.content || '';
      // Very simple extraction from the text output; fallback to local heuristics.
      try {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const parsed = JSON.parse(content.slice(jsonStart, jsonEnd));
          const fallback = generateAISuggestion(prompt);
          return res.json({
            title: parsed.title || fallback.title,
            description: parsed.description || parsed.desc || fallback.description,
            labels: Array.isArray(parsed.labels) && parsed.labels.length > 0 ? parsed.labels : fallback.labels,
            dueDate: parsed.dueDate || fallback.dueDate,
          });
        }
      } catch (err) {
        console.warn('OpenAI content parse failed', err);
      }

      return res.json(generateAISuggestion(prompt));
    }

    res.json(generateAISuggestion(prompt));
  } catch (error) {
    console.error('AI suggestion error', error);
    res.status(500).json({ error: 'AI suggestion failed' });
  }
});

const seedDefaultData = async () => {
  const rows = await queryAsync('SELECT COUNT(*) AS cnt FROM lists');
  if (rows[0].cnt === 0) {
    const listData = [
      { id: 'list-1', title: 'To Do' },
      { id: 'list-2', title: 'In Progress' },
      { id: 'list-3', title: 'Done' },
    ];
    for (let i = 0; i < listData.length; i++) {
      await runAsync('INSERT INTO lists(id, title, position) VALUES (?, ?, ?)', [listData[i].id, listData[i].title, i + 1]);
    }
    await runAsync('INSERT INTO cards(id, listId, title, description, labels, dueDate, position) VALUES (?, ?, ?, ?, ?, ?, ?)', ['card-1', 'list-1', 'Welcome to Trello Clone', 'Drag cards and lists, edit text, or delete this card.', JSON.stringify(['welcome', 'example']), '', 1]);
  }
};

seedDefaultData().catch((err) => console.error('Seed error', err));

app.get('/board', async (req, res) => {
  try {
    const board = await getBoardData();
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load board' });
  }
});

app.put('/board', async (req, res) => {
  const updated = req.body;
  if (!updated || !Array.isArray(updated.lists)) {
    return res.status(400).json({ error: 'Invalid board format' });
  }

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare('UPDATE lists SET position = ? WHERE id = ?');
        updated.lists.forEach((list, index) => {
          stmt.run(index + 1, list.id);
        });
        stmt.finalize((err) => (err ? reject(err) : resolve()));
      });
    });

    // Card order within lists if provided
    for (const list of updated.lists) {
      if (Array.isArray(list.cards)) {
        await new Promise((resolve, reject) => {
          db.serialize(() => {
            const stmt = db.prepare('UPDATE cards SET position = ?, listId = ? WHERE id = ?');
            list.cards.forEach((card, idx) => {
              stmt.run(idx + 1, list.id, card.id);
            });
            stmt.finalize((err) => (err ? reject(err) : resolve()));
          });
        });
      }
    }

    const board = await getBoardData();
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update board' });
  }
});

app.post('/list', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'List title is required' });
  }

  try {
    const row = await queryAsync('SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM lists');
    const position = row[0].nextPos;
    const id = generateId('list');
    await runAsync('INSERT INTO lists(id, title, position) VALUES (?, ?, ?)', [id, title.trim(), position]);
    res.status(201).json({ id, title: title.trim(), cards: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add list' });
  }
});

app.post('/card', async (req, res) => {
  const { listId, title, description, labels, dueDate } = req.body;
  if (!listId || !title) {
    return res.status(400).json({ error: 'listId and title are required' });
  }

  try {
    const listExists = await queryAsync('SELECT id FROM lists WHERE id = ?', [listId]);
    if (!listExists.length) return res.status(404).json({ error: 'List not found' });

    const row = await queryAsync('SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM cards WHERE listId = ?', [listId]);
    const position = row[0].nextPos;
    const id = generateId('card');

    await runAsync('INSERT INTO cards(id, listId, title, description, labels, dueDate, position) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      id,
      listId,
      title.trim(),
      description ? description.trim() : '',
      JSON.stringify(Array.isArray(labels) ? labels : []),
      dueDate ? dueDate : '',
      position,
    ]);

    res.status(201).json({ id, listId, title: title.trim(), description: description ? description.trim() : '', labels: Array.isArray(labels) ? labels : [], dueDate: dueDate || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add card' });
  }
});

app.put('/card/:id', async (req, res) => {
  const cardId = req.params.id;
  const { title, description, listId } = req.body;

  try {
    const cardRows = await queryAsync('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!cardRows.length) return res.status(404).json({ error: 'Card not found' });

    const current = cardRows[0];
    const updates = [];
    const args = [];

    if (title !== undefined) { updates.push('title = ?'); args.push(title.trim()); }
    if (description !== undefined) { updates.push('description = ?'); args.push(description.trim()); }
    if (labels !== undefined) { updates.push('labels = ?'); args.push(JSON.stringify(Array.isArray(labels) ? labels : [])); }
    if (dueDate !== undefined) { updates.push('dueDate = ?'); args.push(dueDate ? dueDate : ''); }

    let newListId = current.listId;
    if (listId && listId !== current.listId) {
      const listExists = await queryAsync('SELECT id FROM lists WHERE id = ?', [listId]);
      if (!listExists.length) return res.status(404).json({ error: 'Destination list not found' });
      newListId = listId;
      const positionRow = await queryAsync('SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM cards WHERE listId = ?', [listId]);
      updates.push('listId = ?', 'position = ?');
      args.push(listId, positionRow[0].nextPos);
    }

    if (updates.length > 0) {
      args.push(cardId);
      await runAsync(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, args);
    }

    const updatedCard = await queryAsync('SELECT id, listId, title, description FROM cards WHERE id = ?', [cardId]);
    res.json(updatedCard[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

app.delete('/card/:id', async (req, res) => {
  const cardId = req.params.id;
  try {
    const cardRows = await queryAsync('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!cardRows.length) return res.status(404).json({ error: 'Card not found' });

    await runAsync('DELETE FROM cards WHERE id = ?', [cardId]);
    res.json(cardRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// Frontend route fallback for single-page app behavior
app.get('*', (req, res) => {
  if (req.path.startsWith('/board') || req.path.startsWith('/list') || req.path.startsWith('/card')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Try another port with PORT=<number> npm start.`);
  } else {
    console.error('Server error', err);
  }
});
