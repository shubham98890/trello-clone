import React, { useEffect, useState } from 'react';

function CardModal({ card, isOpen, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [labels, setLabels] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setLabels((card.labels || []).join(', '));
      setDueDate(card.dueDate || '');
    }
  }, [card]);

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl border border-slate-200">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-bold text-slate-900">Edit Card</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            ✕
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 mt-1 w-full rounded-md border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mb-3 mt-1 h-20 w-full resize-none rounded-md border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <label className="block text-sm font-medium text-slate-700">Labels (comma-separated)</label>
        <input
          type="text"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          className="mb-3 mt-1 w-full rounded-md border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. feature, important"
        />

        <label className="block text-sm font-medium text-slate-700">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mb-4 mt-1 w-full rounded-md border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex justify-between">
          <button
            onClick={() => onDelete(card.id)}
            className="rounded-md bg-red-500 px-3 py-1 text-white hover:bg-red-600"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(card.id, { title, description, labels: labels.split(',').map((l) => l.trim()).filter(Boolean), dueDate })}
              className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
