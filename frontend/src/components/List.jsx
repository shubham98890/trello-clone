import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';

function List({ list, onAddCard, onOpenCard, onUpdateCard, onDeleteCard }) {
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');

  const handleAddCard = async (e) => {
    e.preventDefault();
    const title = cardTitle.trim();
    if (!title) return;

    await onAddCard(list.id, title, cardDescription);
    setCardTitle('');
    setCardDescription('');
  };

  return (
    <div className="min-w-[290px] max-w-[290px] bg-gradient-to-br from-white to-slate-100 rounded-2xl p-3 shadow-2xl border border-slate-200 flex flex-col max-h-[calc(100vh-180px)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">{list.title}</h2>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{list.cards.length}</span>
      </div>
      <Droppable droppableId={list.id} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 overflow-y-auto pr-1 pb-2 min-h-[40px] rounded-lg ${
              snapshot.isDraggingOver ? 'bg-cyan-50 ring ring-cyan-300' : 'bg-slate-50'
            }`}
          >
            {list.cards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                index={index}
                listId={list.id}
                onOpenCard={onOpenCard}
                onUpdateCard={onUpdateCard}
                onDeleteCard={onDeleteCard}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <form onSubmit={handleAddCard} className="mt-3 space-y-2">
        <input
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          placeholder="Card title"
          className="w-full rounded-md border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <textarea
          value={cardDescription}
          onChange={(e) => setCardDescription(e.target.value)}
          placeholder="Card description (optional)"
          className="w-full rounded-md border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-16 resize-none"
        />
        <button type="submit" className="w-full rounded-md bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-700">
          Add Card
        </button>
      </form>
    </div>
  );
}

export default List;
