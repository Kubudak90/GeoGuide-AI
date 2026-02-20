import React from 'react';
import { UtensilsCrossed, Landmark, TreePine, Coffee, Hotel, ShoppingBag } from 'lucide-react';
import { useTranslation } from '../i18n';

interface FilterBarProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

const FILTERS = [
  { key: 'restaurant', icon: UtensilsCrossed, labelKey: 'restaurant' as const },
  { key: 'museum', icon: Landmark, labelKey: 'museum' as const },
  { key: 'park', icon: TreePine, labelKey: 'park' as const },
  { key: 'cafe', icon: Coffee, labelKey: 'cafe' as const },
  { key: 'hotel', icon: Hotel, labelKey: 'hotel' as const },
  { key: 'shopping', icon: ShoppingBag, labelKey: 'shopping' as const },
];

const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      {FILTERS.map(({ key, icon: Icon, labelKey }) => {
        const isActive = activeFilter === key;
        return (
          <button
            key={key}
            onClick={() => onFilterChange(isActive ? null : key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Icon size={14} />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
};

export default FilterBar;
