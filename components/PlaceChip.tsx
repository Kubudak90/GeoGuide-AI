import React, { memo } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Place, Coordinates } from '../types';
import { calculateDistance, formatDistance } from '../utils/distance';

interface PlaceChipProps {
    place: Place;
    onClick: (place: Place) => void;
    userLocation?: Coordinates;
}

const PlaceChip: React.FC<PlaceChipProps> = memo(({ place, onClick, userLocation }) => {
    const distanceText = userLocation
        ? formatDistance(calculateDistance(
            userLocation.latitude, userLocation.longitude,
            place.coordinates.lat, place.coordinates.lng
          ))
        : null;

    return (
        <button
            onClick={() => onClick(place)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-600 transition-all text-left group w-full max-w-xs"
        >
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{place.name}</h4>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.category}</p>
                    {distanceText && (
                        <span className="text-xs text-emerald-600 font-medium flex-shrink-0">{distanceText}</span>
                    )}
                </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-colors" />
        </button>
    );
});

PlaceChip.displayName = 'PlaceChip';

export default PlaceChip;
