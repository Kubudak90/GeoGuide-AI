import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Place } from '../types';

interface PlaceChipProps {
    place: Place;
    onClick: (place: Place) => void;
}

const PlaceChip: React.FC<PlaceChipProps> = ({ place, onClick }) => {
    return (
        <button
            onClick={() => onClick(place)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left group w-full max-w-xs"
        >
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm truncate">{place.name}</h4>
                <p className="text-xs text-gray-500 truncate">{place.category}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
        </button>
    );
};

export default PlaceChip;
