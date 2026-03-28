import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

export const getBoard = async () => {
  const response = await api.get('/board');
  return response.data;
};

export const addList = async (title) => {
  const response = await api.post('/list', { title });
  return response.data;
};

export const addCard = async ({ listId, title, description }) => {
  const response = await api.post('/card', { listId, title, description });
  return response.data;
};

export const updateCard = async (id, data) => {
  const response = await api.put(`/card/${encodeURIComponent(id)}`, data);
  return response.data;
};

export const deleteCard = async (id) => {
  const response = await api.delete(`/card/${encodeURIComponent(id)}`);
  return response.data;
};

export const suggestCard = async ({ listId, prompt }) => {
  const response = await api.post('/ai/suggest-card', { listId, prompt });
  return response.data;
};

export const updateBoard = async (board) => {
  const response = await api.put('/board', board);
  return response.data;
};
