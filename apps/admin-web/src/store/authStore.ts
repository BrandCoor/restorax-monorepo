import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId: string | null;
  branchId: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Server-Side Rendering (SSR) sırasında hata almamak için tarayıcı (window) kontrolü yapıyoruz
  token: typeof window !== 'undefined' ? localStorage.getItem('restorax_token') : null,
  user: typeof window !== 'undefined' && localStorage.getItem('restorax_user')
    ? JSON.parse(localStorage.getItem('restorax_user') as string)
    : null,

  login: (token, user) => {
    localStorage.setItem('restorax_token', token);
    localStorage.setItem('restorax_user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('restorax_token');
    localStorage.removeItem('restorax_user');
    set({ token: null, user: null });
  },
}));