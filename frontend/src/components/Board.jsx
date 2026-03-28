import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import List from './List';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const moveCard = (source, destination, sourceDroppable, destinationDroppable, sourceIndex, destinationIndex) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(sourceIndex, 1);
  destClone.splice(destinationIndex, 0, removed);

  const result = {};
  result[sourceDroppable] = sourceClone;
  result[destinationDroppable] = destClone;

  return result;
};

function Board({ board, setBoard, onAddList, onAddCard, onOpenCard, onUpdateCard, onDeleteCard, updateBoardBackend }) {
  const [listTitle, setListTitle] = useState('');

  const handleAddList = async (e) => {
    e.preventDefault();
    const value = listTitle.trim();
    if (!value) return;
    const newList = await onAddList(value);
    if (newList) {
      setBoard((prev) => ({ ...prev, lists: [...prev.lists, newList] }));
      setListTitle('');
      await updateBoardBackend({ ...board, lists: [...board.lists, newList] });
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'LIST') {
      const newLists = reorder(board.lists, source.index, destination.index);
      const newBoard = { ...board, lists: newLists };
      setBoard(newBoard);
      await updateBoardBackend(newBoard);
      return;
    }

    if (type === 'CARD') {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;

      const sourceList = board.lists.find((l) => l.id === sourceListId);
      const destinationList = board.lists.find((l) => l.id === destListId);
      if (!sourceList || !destinationList) return;

      let newLists;
      if (sourceListId === destListId) {
        const reordered = reorder(sourceList.cards, source.index, destination.index);
        newLists = board.lists.map((list) =>
          list.id === sourceListId ? { ...list, cards: reordered } : list
        );
      } else {
        const moved = moveCard(sourceList.cards, destinationList.cards, sourceListId, destListId, source.index, destination.index);
        newLists = board.lists.map((list) => {
          if (list.id === sourceListId) return { ...list, cards: moved[sourceListId] };
          if (list.id === destListId) return { ...list, cards: moved[destListId] };
          return list;
        });
      }

      const newBoard = { ...board, lists: newLists };
      setBoard(newBoard);
      await updateBoardBackend(newBoard);

      if (sourceListId !== destListId) {
        const movedCard = newBoard.lists
          .find((l) => l.id === destListId)
          .cards[destination.index];
        if (movedCard) {
          await onUpdateCard(movedCard.id, { ...movedCard, listId: destListId });
        }
      }
    }
  };

  return (
    <div className="px-4 py-4 h-full">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-violet-200 via-sky-100 to-cyan-200 p-4 shadow-lg border border-white/70 backdrop-blur-sm backdrop-saturate-150">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">Trello Copy Pro</h1>
            <p className="mt-1 text-sm text-slate-600">A modern kanban experience with smooth drag-and-drop, editable cards, and persistent storage.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-600/15 px-3 py-1 text-xs font-semibold text-indigo-700">Live</span>
            <span className="rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-semibold text-emerald-700">Interactive</span>
          </div>
        </div>
        <form onSubmit={handleAddList} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            placeholder="Add a list (e.g. To Do)"
            className="w-full rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300"
          />
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg" type="submit">
            + Add List
          </button>
        </form>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-240px)]"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {board.lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(draggableProvided) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      {...draggableProvided.dragHandleProps}
                      className="min-w-[280px]"
                    >
                      <List
                        list={list}
                        onAddCard={onAddCard}
                        onOpenCard={onOpenCard}
                        onUpdateCard={onUpdateCard}
                        onDeleteCard={onDeleteCard}
                        board={board}
                        setBoard={setBoard}
                        updateBoardBackend={updateBoardBackend}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default Board;
