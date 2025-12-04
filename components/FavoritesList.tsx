import React from 'react';
import { PlaceDetails } from '../types';
import { X, MapPin, Navigation2, Trash2 } from 'lucide-react';

interface FavoritesListProps {
    favorites: PlaceDetails[];
    onClose: () => void;
    onSelect: (place: PlaceDetails) => void;
    onRemove: (place: PlaceDetails) => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onClose, onSelect, onRemove }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-red-500">❤️</span> My Favorites
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 flex-1">
                    {favorites.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <MapPin size={32} className="opacity-50" />
                            </div>
                            <p>No favorites yet.</p>
                            <p className="text-sm mt-1">Start exploring and save places you like!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {favorites.map((place, index) => (
                                <div
                                    key={`${place.name}-${index}`}
                                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all bg-white group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <MapPin size={18} />
                                    </div>

                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(place)}>
                                        <h3 className="font-semibold text-gray-800 truncate">{place.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{place.category || 'Place'}</p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onSelect(place)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="View on Map"
                                        >
                                            <Navigation2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onRemove(place)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FavoritesList;
