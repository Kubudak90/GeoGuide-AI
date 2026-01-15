import React, { useState, useEffect } from 'react';
import { X, Navigation2, Globe, Heart, Star, Loader2 } from 'lucide-react';
import { Place, PlaceDetails } from '../types';
import { getWikipediaPhoto } from '../services/mapService';

interface PlaceDetailModalProps {
    place: Place;
    onClose: () => void;
    onNavigate: (place: Place) => void;
    onToggleFavorite: (place: PlaceDetails) => void;
    isFavorite: (place: PlaceDetails) => boolean;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose, onNavigate, onToggleFavorite, isFavorite }) => {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoLoading, setPhotoLoading] = useState(true);

    useEffect(() => {
        const fetchPhoto = async () => {
            setPhotoLoading(true);
            const wikiPhoto = await getWikipediaPhoto(place.name);
            setPhotoUrl(wikiPhoto);
            setPhotoLoading(false);
        };
        fetchPhoto();
    }, [place.name]);
    // Convert Place to PlaceDetails for compatibility with App.tsx state
    const placeDetails: PlaceDetails = {
        id: `place-${place.name}`, // Generate ID based on name if missing
        name: place.name,
        formatted_address: '',
        geometry: {
            location: place.coordinates
        },
        website: place.website || undefined,
        // Preserve extra fields for display if needed, but PlaceDetails is the state type
        // We might need to extend PlaceDetails or just store what we have.
        // For now, let's ensure we store enough to display in FavoritesList.
        // We'll cheat a bit and cast or ensure PlaceDetails has category/desc if we want to show them in favorites list.
    };

    // Actually, we should probably update PlaceDetails type to include category/desc or make FavoritesList accept Place.
    // But to fix the immediate type error and logic:
    const placeForFavorite: any = {
        ...placeDetails,
        category: place.category,
        short_description: place.short_description
    };

    const isFav = isFavorite(placeForFavorite);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header Image */}
                <div className="h-40 bg-emerald-600 relative overflow-hidden">
                    {photoLoading ? (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-500">
                            <Loader2 size={32} className="text-white animate-spin" />
                        </div>
                    ) : photoUrl ? (
                        <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
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
                        <h2 className="text-2xl font-bold mt-1 drop-shadow-lg">{place.name}</h2>
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
                            onClick={() => onToggleFavorite(placeForFavorite)}
                            className={`p-3 rounded-xl transition-colors flex items-center justify-center ${isFav ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                        >
                            <Heart size={20} className={isFav ? "fill-current" : ""} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceDetailModal;
