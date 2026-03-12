import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api';

async function getHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Bir hata olustu');
  }

  return data;
}

export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const usersAPI = {
  list: (search = '') => request(`/users?search=${encodeURIComponent(search)}`),
  getById: (id) => request(`/users/${id}`),
};

export const chatsAPI = {
  list: () => request('/chats'),
  createDirect: (userId) => request('/chats/direct', { method: 'POST', body: JSON.stringify({ userId }) }),
  createGroup: (name, participantIds) =>
    request('/chats/group', { method: 'POST', body: JSON.stringify({ name, participantIds }) }),
  getMessages: (chatId, before = null) =>
    request(`/chats/${chatId}/messages${before ? `?before=${before}` : ''}`),
  addParticipant: (chatId, userId) =>
    request(`/chats/${chatId}/participants`, { method: 'POST', body: JSON.stringify({ userId }) }),
};
