import React from 'react';
import { Car, Footprints, Bike, X, Clock, Ruler, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';

export type TransportMode = 'driving' | 'walking' | 'cycling';

interface RouteInfoPanelProps {
  distance: number; // meters
  duration: number; // seconds
  mode: TransportMode;
  onModeChange: (mode: TransportMode) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MODE_ICONS = {
  driving: Car,
  walking: Footprints,
  cycling: Bike,
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({ distance, duration, mode, onModeChange, onCancel, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Transport Mode Selector */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {(Object.keys(MODE_ICONS) as TransportMode[]).map((m) => {
          const Icon = MODE_ICONS[m];
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
            >
              <Icon size={18} />
              {t(m)}
            </button>
          );
        })}
      </div>

      {/* Route Info */}
      <div className="p-4 flex items-center justify-between relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10">
            <Loader2 size={20} className="animate-spin text-emerald-600" />
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <Clock size={16} className="text-emerald-600" />
            <span className="font-bold text-lg">{formatDuration(duration)}</span>
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Ruler size={16} />
            <span className="text-sm">{formatDistance(distance)}</span>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          title={t('cancel_route')}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default RouteInfoPanel;
