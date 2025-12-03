import React from 'react';
import { GroundingMetadata } from '../types';
import { MapPin, Search, ExternalLink, Globe, Star } from 'lucide-react';

interface GroundingChipsProps {
  metadata?: GroundingMetadata;
}

const GroundingChips: React.FC<GroundingChipsProps> = ({ metadata }) => {
  if (!metadata) return null;

  const { mapChunks, searchChunks } = metadata;

  if ((!mapChunks || mapChunks.length === 0) && (!searchChunks || searchChunks.length === 0)) return null;

  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-3">
      
      {/* Map Results Section */}
      {mapChunks && mapChunks.length > 0 && (
        <div className="space-y-2">
          {/* Distinct Map Header */}
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-md">
               <MapPin size={14} />
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Locations Found</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {mapChunks.map((chunk, idx) => (
              <a
                key={`map-${idx}`}
                href={chunk.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex bg-white rounded-xl border border-emerald-200 overflow-hidden hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                {/* Static Map Visual Placeholder with Tint */}
                <div className="w-24 bg-emerald-50 relative flex-shrink-0 border-r border-emerald-100 flex items-center justify-center">
                   {/* Abstract Map Pattern */}
                   <div className="absolute inset-0 opacity-20" 
                        style={{
                            backgroundImage: 'radial-gradient(#059669 1px, transparent 1px)',
                            backgroundSize: '8px 8px'
                        }}>
                   </div>
                   {/* Map Pin */}
                   <div className="relative z-10 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 ring-2 ring-emerald-50">
                      <MapPin size={16} fill="currentColor" className="opacity-20 absolute" />
                      <MapPin size={16} />
                   </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-3 min-w-0 flex flex-col justify-center bg-gradient-to-r from-emerald-50/30 to-transparent">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                      {chunk.title}
                    </h4>
                    <ExternalLink size={12} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {chunk.address && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {chunk.address}
                    </p>
                  )}

                  {chunk.snippet && (
                    <div className="mt-1.5 flex items-start gap-1">
                        <Star size={10} className="text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" />
                        <p className="text-[10px] text-gray-500 italic line-clamp-1">
                            "{chunk.snippet}"
                        </p>
                    </div>
                  )}

                  {!chunk.address && !chunk.snippet && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          Open in Google Maps
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
           {/* Distinct Search Header */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
               <Globe size={14} />
            </div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Web Sources</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {searchChunks.map((chunk, idx) => (
              <a
                key={`search-${idx}`}
                href={chunk.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 max-w-full px-3 py-2 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all text-xs text-blue-900 group"
              >
                 <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
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
