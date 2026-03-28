import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

function Card({ card, index, onOpenCard, onDeleteCard }) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`relative rounded-xl bg-white p-3 shadow-sm border border-slate-200 cursor-pointer transition duration-200 ease-in-out ${
            snapshot.isDragging ? 'bg-indigo-50 border-indigo-300 shadow-2xl scale-[1.02]' : 'hover:shadow-md hover:-translate-y-0.5'
          }`}
          onClick={() => onOpenCard(card)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCard(card.id);
            }}
            className="absolute right-2 top-2 text-xs text-rose-500 hover:text-rose-600"
            title="Delete card"
          >
            ✕
          </button>
          <div className="mb-2 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-400 to-cyan-400" />
          <strong className="block text-sm font-semibold text-slate-900">{card.title}</strong>
          <p className="mt-1 text-xs text-slate-600 min-h-[28px]">{card.description || 'No description provided.'}</p>
          {card.labels && card.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {card.labels.map((label) => (
                <span key={label} className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">{label}</span>
              ))}
            </div>
          )}
          {card.dueDate && (
            <div className="mt-2 text-[11px] text-rose-600">Due: {new Date(card.dueDate).toLocaleDateString()}</div>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-blue-600">●</span>
            <span className="italic">Tap to edit</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default Card;
