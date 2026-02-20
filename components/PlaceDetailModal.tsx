import React from 'react';
import { X, Navigation2, Globe, Heart } from 'lucide-react';
import { Place, PlaceDetails } from '../types';
import ShareButton from './ShareButton';
import { useTranslation } from '../i18n';

interface PlaceDetailModalProps {
    place: Place;
    onClose: () => void;
    onNavigate: (place: Place) => void;
    onToggleFavorite: (place: PlaceDetails) => void;
    isFavorite: (place: PlaceDetails) => boolean;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose, onNavigate, onToggleFavorite, isFavorite }) => {
    const { t } = useTranslation();

    const placeDetails: PlaceDetails = {
        id: `place-${place.name}`,
        name: place.name,
        formatted_address: '',
        geometry: { location: place.coordinates },
        website: place.website || undefined,
        category: place.category,
        short_description: place.short_description,
    };

    const isFav = isFavorite(placeDetails);

    return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="h-32 bg-emerald-600 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                        aria-label={t('close')}
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
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                        {place.short_description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => onNavigate(place)}
                            className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Navigation2 size={20} />
                            {t('go_there')}
                        </button>

                        {place.website && (
                            <a
                                href={place.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                                title={t('website')}
                            >
                                <Globe size={20} />
                            </a>
                        )}

                        <ShareButton
                            name={place.name}
                            lat={place.coordinates.lat}
                            lng={place.coordinates.lng}
                            description={place.short_description}
                        />

                        <button
                            onClick={() => onToggleFavorite(placeDetails)}
                            className={`p-3 rounded-xl transition-colors flex items-center justify-center ${isFav ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            title={isFav ? t('removed_from_favorites') : t('added_to_favorites')}
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
