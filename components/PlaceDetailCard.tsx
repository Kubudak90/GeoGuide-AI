import React, { memo } from 'react';
import { PlaceDetails, Coordinates } from '../types';
import { Star, X, Globe, Navigation, MessageSquare, DollarSign, MapPin, ArrowRightCircle } from 'lucide-react';
import ShareButton from './ShareButton';
import PhotoGallery from './PhotoGallery';
import { useTranslation } from '../i18n';
import { calculateDistance, formatDistance } from '../utils/distance';

interface PlaceDetailCardProps {
  place: PlaceDetails;
  onClose: () => void;
  onNavigate?: () => void;
  userLocation?: Coordinates;
}

const PlaceDetailCard: React.FC<PlaceDetailCardProps> = ({ place, onClose, onNavigate, userLocation }) => {
  const { t } = useTranslation();

  const distanceText = userLocation
    ? formatDistance(calculateDistance(
        userLocation.latitude, userLocation.longitude,
        place.geometry.location.lat, place.geometry.location.lng
      ))
    : null;

  return (
    <div className="absolute right-4 bottom-4 md:right-6 md:bottom-6 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300" role="dialog" aria-modal="true">

      {/* Header Image */}
      <div className="h-40 bg-gray-200 dark:bg-gray-800 relative">
        <PhotoGallery photos={place.photos || []} name={place.name} />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10"
          aria-label={t('close')}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{place.name}</h2>
          {place.price_level !== undefined && (
            <div className="flex text-gray-400 text-xs">
              {[...Array(4)].map((_, i) => (
                <DollarSign
                  key={i}
                  size={12}
                  className={i < (place.price_level || 0) ? "text-emerald-600" : ""}
                  fill={i < (place.price_level || 0) ? "currentColor" : "none"}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">{place.formatted_address}</p>

        {distanceText && (
          <p className="text-xs text-emerald-600 font-medium mb-3">{distanceText} {t('km_away').split(' ').slice(1).join(' ') || ''}</p>
        )}

        {/* Ratings & Status */}
        {(place.rating || place.isOpenNow !== undefined) && (
          <div className="flex items-center gap-4 mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            {place.rating && (
              <div className="flex items-center gap-1.5">
                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-1.5 py-0.5 rounded text-sm font-bold flex items-center gap-1">
                  {place.rating} <Star size={12} fill="currentColor" />
                </div>
                {place.user_ratings_total && (
                  <span className="text-xs text-gray-400">({place.user_ratings_total} reviews)</span>
                )}
              </div>
            )}
            {place.isOpenNow !== undefined && (
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${place.isOpenNow ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                {place.isOpenNow ? t('open_now') : t('closed')}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-emerald-200 dark:shadow-emerald-900/30 shadow-md"
            >
              <ArrowRightCircle size={18} /> {t('go')}
            </button>
          )}

          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
              <Globe size={16} /> {t('website')}
            </a>
          )}

          <ShareButton
            name={place.name}
            lat={place.geometry.location.lat}
            lng={place.geometry.location.lng}
            description={place.formatted_address}
            className={`flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${!place.website ? 'col-span-2' : ''}`}
          />
        </div>

        {/* Reviews Snippet */}
        {place.reviews && place.reviews.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              <MessageSquare size={12} /> {t('recent_review')}
            </div>
            <div className="flex gap-2 items-start">
              <img src={place.reviews[0].profile_photo_url} alt="User" className="w-6 h-6 rounded-full" />
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{place.reviews[0].author_name}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={8} fill={i < place.reviews![0].rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-3">"{place.reviews[0].text}"</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PlaceDetailCard);
