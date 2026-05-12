import { create } from 'zustand';

interface User {
  username: string;
  token: string;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: localStorage.getItem('ascella_user') 
    ? JSON.parse(localStorage.getItem('ascella_user') as string) 
    : null,
  setUser: (user) => {
    if (user) {
      localStorage.setItem('ascella_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ascella_user');
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('ascella_user');
    set({ user: null });
  }
}));
