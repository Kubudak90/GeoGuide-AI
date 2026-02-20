import React from 'react';
import { Clock, X, Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n';

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
  visible: boolean;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onSelect, onRemove, onClear, visible }) => {
  const { t } = useTranslation();

  if (!visible || history.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50 max-h-64 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {t('search_history')}
        </span>
        <button
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
        >
          <Trash2 size={12} />
          {t('clear_history')}
        </button>
      </div>
      <div className="overflow-y-auto max-h-48">
        {history.map((query) => (
          <div
            key={query}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
          >
            <Clock size={14} className="text-gray-400 flex-shrink-0" />
            <span
              className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate"
              onClick={() => onSelect(query)}
            >
              {query}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(query);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchHistory;
