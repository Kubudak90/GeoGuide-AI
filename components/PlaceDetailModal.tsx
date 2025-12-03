import React from 'react';
import { X, Navigation2, Globe, Heart, Star } from 'lucide-react';
import { Place } from '../types';

interface PlaceDetailModalProps {
    place: Place;
    onClose: () => void;
    onNavigate: (place: Place) => void;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose, onNavigate }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header Image Placeholder (could be dynamic later) */}
                <div className="h-32 bg-emerald-600 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-6 text-white">
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/30">
                            {place.category}
                        </span>
                        <h2 className="text-2xl font-bold mt-1 shadow-black drop-shadow-md">{place.name}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 leading-relaxed mb-6">
                        {place.short_description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => onNavigate(place)}
                            className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Navigation2 size={20} />
                            Go There
                        </button>

                        {place.website && (
                            <a
                                href={place.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center"
                                title="Visit Website"
                            >
                                <Globe size={20} />
                            </a>
                        )}

                        <button
                            className="bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center"
                            title="Add to Favorites"
                        >
                            <Heart size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceDetailModal;
