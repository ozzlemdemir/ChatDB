import axios from 'axios';

const BASE_URL = 'https://lyricism-finalize-unless.ngrok-free.dev';

// Axios instance oluştur
// Her istekte otomatik olarak token eklenecek
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    }
});
// Her istekten önce token varsa header'a ekle
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── AUTH ─────────────────────────────────────────
export const register = (username, email, password) =>
    api.post('/auth/register', { username, email, password });

export const login = (email, password) =>
    api.post('/auth/login', { email, password });

export const getMe = () =>
    api.get('/auth/me');

export const updateProfile = (data) =>
    api.put('/auth/me', data);

// ── QUERY ────────────────────────────────────────
export const sendQuery = (question, dbConfig, conversationId = null) =>
    api.post('/query', {
        question,
        ...dbConfig,
        port: parseInt(dbConfig.port),
        conversation_id: conversationId || undefined
    });

// ── CONVERSATIONS ────────────────────────────────
export const getConversations = () =>
    api.get('/conversations');

export const getConversation = (id) =>
    api.get(`/conversations/${id}`);

export const deleteConversation = (id) =>
    api.delete(`/conversations/${id}`);

// ── CONNECTIONS ──────────────────────────────────
export const testConnection = (dbConfig) =>
    api.post('/test-connection', dbConfig);

export const saveConnection = (name, dbConfig) =>
    api.post('/connections/save', { name, ...dbConfig });

export const getConnections = () =>
    api.get('/connections');