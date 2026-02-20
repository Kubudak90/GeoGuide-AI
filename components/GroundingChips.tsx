import React from 'react';
import { GroundingMetadata } from '../types';
import { MapPin, Search, ExternalLink, Globe, Star } from 'lucide-react';
import { useTranslation } from '../i18n';

interface GroundingChipsProps {
  metadata?: GroundingMetadata;
}

const GroundingChips: React.FC<GroundingChipsProps> = ({ metadata }) => {
  const { t } = useTranslation();

  if (!metadata) return null;

  const { mapChunks, searchChunks } = metadata;

  if ((!mapChunks || mapChunks.length === 0) && (!searchChunks || searchChunks.length === 0)) return null;

  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-3">

      {/* Map Results Section */}
      {mapChunks && mapChunks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-1.5 rounded-md">
              <MapPin size={14} />
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{t('locations_found')}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {mapChunks.map((chunk, idx) => (
              <a
                key={`map-${idx}`}
                href={chunk.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all group"
              >
                <div className="w-24 bg-emerald-50 dark:bg-emerald-900/20 relative flex-shrink-0 border-r border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(#059669 1px, transparent 1px)',
                      backgroundSize: '8px 8px'
                    }}>
                  </div>
                  <div className="relative z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-emerald-600 ring-2 ring-emerald-50 dark:ring-emerald-900">
                    <MapPin size={16} fill="currentColor" className="opacity-20 absolute" />
                    <MapPin size={16} />
                  </div>
                </div>

                <div className="flex-1 p-3 min-w-0 flex flex-col justify-center bg-gradient-to-r from-emerald-50/30 dark:from-emerald-900/10 to-transparent">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {chunk.title}
                    </h4>
                    <ExternalLink size={12} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {chunk.address && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{chunk.address}</p>
                  )}

                  {chunk.snippet && (
                    <div className="mt-1.5 flex items-start gap-1">
                      <Star size={10} className="text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" />
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 italic line-clamp-1">"{chunk.snippet}"</p>
                    </div>
                  )}

                  {!chunk.address && !chunk.snippet && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {t('open_in_google_maps')}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Section */}
      {searchChunks && searchChunks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-1.5 rounded-md">
              <Globe size={14} />
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">{t('web_sources')}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {searchChunks.map((chunk, idx) => (
              <a
                key={`search-${idx}`}
                href={chunk.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 max-w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-xs text-blue-900 dark:text-blue-300 group"
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                  <Search size={10} />
                </div>
                <span className="truncate max-w-[200px] font-medium">{chunk.title}</span>
                <ExternalLink size={10} className="flex-shrink-0 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroundingChips;
