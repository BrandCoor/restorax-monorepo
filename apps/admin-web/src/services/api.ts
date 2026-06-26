import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Backend sunucumuz artık 3000 portunda çalıştığı için burayı 3000 yaptık
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her API isteğinde tarayıcıdaki JWT token'ını otomatik olarak Authorization Header'a ekler
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('restorax_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;