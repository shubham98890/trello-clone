Trello Clone – Fullstack Kanban Project Management App

A fully functional Kanban-style project management application inspired by Trello.
This project demonstrates real-world fullstack development skills including UI design, API integration, and database handling.
<img width="1247" height="635" alt="Screenshot (129)" src="https://github.com/user-attachments/assets/7f8a203f-22c0-4bd5-9560-0c8de83948c0" />

This application allows users to:
Create a board (project workspace)
Add lists (columns like To Do, In Progress)
Manage cards (tasks)
Organize workflow visually using drag-and-drop

Key Concepts:
1. Board
A Board represents a complete project.
Example:

“Website Development”
“Job Preparation”
<img width="1247" height="635" alt="Screenshot (129)" src="https://github.com/user-attachments/assets/b571219e-f7db-4f47-8363-86be1e0cc9e6" />
2. List (Column)
A List is a stage of work.
Examples:
To Do
In Progress
Done

<img width="1247" height="635" alt="Screenshot (129)" src="https://github.com/user-attachments/assets/05fb95a9-b5a0-40dd-93cf-0084257bbd0b" />
3. Card (Task)
A Card represents an individual task.
Example:

“Design Login Page”
“Fix API Bug”
<img width="1272" height="489" alt="Screenshot (130)" src="https://github.com/user-attachments/assets/468311b4-292a-4f54-bc5e-ef017306f0b4" />
4. Drag and Drop
Users can move cards between lists.
Example:
Move from “To Do” → “Done”
<img width="1366" height="644" alt="Screenshot (131)" src="https://github.com/user-attachments/assets/019007d1-4338-4c5b-828e-8b49343df562" />
5. Due Date
Deadline assigned to a card.
<img width="1311" height="666" alt="Screenshot (132)" src="https://github.com/user-attachments/assets/ab6d9c0d-0de8-44fa-a28f-cd81289337ff" />
6.Members
Users assigned to a card.
<img width="1247" height="635" alt="Screenshot (129)" src="https://github.com/user-attachments/assets/e2319c50-07e7-4c6a-b22e-9140f42a04ae" />









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

