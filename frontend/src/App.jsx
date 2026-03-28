import React, { useEffect, useState } from 'react';
import Board from './components/Board';
import CardModal from './components/CardModal';
import { getBoard, addList, addCard, updateCard, deleteCard, updateBoard, suggestCard } from './api/api';

function App() {
  const [board, setBoard] = useState({ id: '', title: '', lists: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastDeletedCard, setLastDeletedCard] = useState(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const data = await getBoard();
        setBoard(data);
      } catch (error) {
        console.error('Failed to load board', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBoard();
  }, []);

  const handleAddList = async (title) => {
    try {
      const newList = await addList(title);
      setBoard((prev) => ({ ...prev, lists: [...prev.lists, newList] }));
      return newList;
    } catch (error) {
      console.error('Add list failed', error);
      return null;
    }
  };

  const handleAddCard = async (listId, title, description) => {
    try {
      const newCard = await addCard({ listId, title, description });
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((list) => (list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list)),
      }));
    } catch (error) {
      console.error('Add card failed', error);
    }
  };

  const handleUpdateCard = async (id, data) => {
    try {
      const updated = await updateCard(id, data);
      const boardFromApi = await getBoard();
      setBoard(boardFromApi);
      setSelectedCard(updated);
      return updated;
    } catch (error) {
      console.error('Update card failed', error);
      return null;
    }
  };

  const handleGenerateAISuggestion = async () => {
    if (!aiPrompt.trim()) return;
    if (!board.lists.length) {
      return alert('Please add a list first before using AI suggestions.');
    }

    setAiLoading(true);
    try {
      const suggestion = await suggestCard({ listId: board.lists[0].id, prompt: aiPrompt.trim() });
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error('AI suggestion failed', error);
      setAiSuggestion(null);
      alert('AI assistant failed to generate a suggestion.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAISuggestedCard = async () => {
    if (!aiSuggestion || !aiSuggestion.title) return;

    try {
      const targetListId = board.lists[0].id;
      await addCard({
        listId: targetListId,
        title: aiSuggestion.title,
        description: aiSuggestion.description || '',
      });
      const refreshed = await getBoard();
      setBoard(refreshed);
      setAiSuggestion(null);
      setAiPrompt('');
    } catch (error) {
      console.error('AI card creation failed', error);
      alert('Failed to add AI suggested card.');
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      const cardToDelete = board.lists
        .flatMap((list) => list.cards.map((card) => ({ ...card, listId: list.id })))
        .find((card) => card.id === id);

      if (!cardToDelete) {
        return;
      }

      await deleteCard(id);
      setLastDeletedCard(cardToDelete);
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((list) => ({
          ...list,
          cards: list.cards.filter((card) => card.id !== id),
        })),
      }));
      setModalOpen(false);
      setSelectedCard(null);
    } catch (error) {
      console.error('Delete card failed', error);
    }
  };

  const handleOpenCard = (card) => {
    setSelectedCard(card);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCard(null);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedCard) return;

    try {
      await addCard({
        listId: lastDeletedCard.listId,
        title: lastDeletedCard.title,
        description: lastDeletedCard.description,
      });
      const refreshed = await getBoard();
      setBoard(refreshed);
      setLastDeletedCard(null);
    } catch (error) {
      console.error('Undo delete failed', error);
    }
  };

  const handleBoardUpdate = async (updatedBoard) => {
    try {
      await updateBoard(updatedBoard);
    } catch (error) {
      console.error('Board update failed', error);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading board...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900">
      <header className="border-b border-slate-300 bg-white/80 backdrop-blur-md ps-6 pe-6 pt-4 pb-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-indigo-700">Trello Clone</h1>
          <p className="text-sm text-slate-500">Drag cards, reorder lists, edit cards in modal.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          <div className="flex flex-wrap items-center gap-3">
            <strong>AI Assistant</strong>
            <span>Describe a task and generate a smart card suggestion.</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Add authentication and user profile settings"
              className="flex-1 min-w-[220px] rounded-md border border-indigo-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleGenerateAISuggestion}
              disabled={aiLoading || !aiPrompt.trim()}
              className="rounded-md bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? 'Generating...' : 'Generate'
}
            </button>
          </div>
          {aiSuggestion && (
            <div className="mt-3 rounded-lg border border-indigo-200 bg-white p-3 text-sm text-slate-800">
              <p className="font-semibold">Suggested Title</p>
              <p className="mb-1">{aiSuggestion.title}</p>
              <p className="font-semibold">Suggested Description</p>
              <p className="mb-1">{aiSuggestion.description}</p>
              <p className="font-semibold">Suggested Labels</p>
              <p>{(aiSuggestion.labels || []).join(', ') || 'none'}</p>
              <p className="font-semibold">Suggested Due Date</p>
              <p>{aiSuggestion.dueDate || 'none'}</p>
              <button
                onClick={handleAddAISuggestedCard}
                className="mt-2 rounded-md bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-600"
              >
                Add Suggested Card
              </button>
            </div>
          )}
        </div>

        {lastDeletedCard && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span className="font-semibold">Card deleted.</span>
            <button
              onClick={handleUndoDelete}
              className="ml-3 rounded-md bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-600"
            >
              Undo
            </button>
          </div>
        )}
        <Board
          board={board}
          setBoard={setBoard}
          onAddList={handleAddList}
          onAddCard={handleAddCard}
          onOpenCard={handleOpenCard}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          updateBoardBackend={handleBoardUpdate}
        />
      </main>

      <CardModal
        card={selectedCard}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={async (id, data) => {
          const updated = await handleUpdateCard(id, data);
          if (updated) {
            setModalOpen(false);
          }
        }}
        onDelete={handleDeleteCard}
      />

      <footer className="border-t border-slate-300 bg-white/70 backdrop-blur-md pt-3 pb-3 text-center text-xs text-slate-600">
        Developed using React + Tailwind + Express. Backend/API served from same URL.
      </footer>
    </div>
  );
}

export default App;
