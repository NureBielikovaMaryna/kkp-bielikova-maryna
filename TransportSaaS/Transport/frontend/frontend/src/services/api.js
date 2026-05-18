import axios from 'axios';

const api = axios.create({
  // Заміни 5241 на свій порт бекенда, якщо він відрізняється!
  baseURL: 'http://localhost:5241/api', 
});

export default api;