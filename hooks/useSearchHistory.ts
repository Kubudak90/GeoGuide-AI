import { useState, useCallback } from 'react';

const STORAGE_KEY = 'search_history';
const MAX_ITEMS = 20;

interface UseSearchHistoryReturn {
  history: string[];
  addSearch: (query: string) => void;
  clearHistory: () => void;
  removeItem: (query: string) => void;
}

export const useSearchHistory = (): UseSearchHistoryReturn => {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persist = (items: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_ITEMS);
      persist(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeItem = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== query);
      persist(updated);
      return updated;
    });
  }, []);

  return { history, addSearch, clearHistory, removeItem };
};
