# Trello Clone (Kanban Board App)

Full stack Trello clone with React/Vite/Tailwind frontend and Node/Express backend (in-memory storage).

## Project structure

```
trello-clone/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.jsx
│   │   │   ├── List.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── CardModal.jsx
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
├── backend/
│   ├── server.js
│   ├── package.json
```

## Getting started

### Backend

```bash
cd trello-clone/backend
npm install
npm start
```

Backend runs at `http://localhost:4000`.

### Frontend

```bash
cd trello-clone/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (by default). API proxy is configured to `http://localhost:4000`.

## Features

- Display board with lists and cards
- Add list
- Add card to list
- Edit/delete card
- Drag & drop cards and lists
- Card detail modal editing
- AI Assistant: generate card suggestions from natural language prompt
- Undo recently deleted card

## API

- GET `/board`
- POST `/list`
- POST `/card`
- PUT `/card/:id`
- DELETE `/card/:id`
- PUT `/board` (update whole board object for reorder sync)
- POST `/ai/suggest-card` (body: `{ prompt: string }` returns `{ title, description, labels, dueDate }`)

