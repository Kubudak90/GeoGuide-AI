import React from 'react';
import { PlaceDetails } from '../types';
import { Star, X, Globe, Navigation, MessageSquare, DollarSign, MapPin, ArrowRightCircle } from 'lucide-react';

interface PlaceDetailCardProps {
  place: PlaceDetails;
  onClose: () => void;
  onNavigate?: () => void;
}

const PlaceDetailCard: React.FC<PlaceDetailCardProps> = ({ place, onClose, onNavigate }) => {
  // Use first photo URL if available
  const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0] : null;

  return (
    <div className="absolute right-4 bottom-4 md:right-6 md:bottom-6 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">

      {/* Header Image */}
      <div className="h-40 bg-gray-200 relative">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-300">
            <MapPin size={48} />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{place.name}</h2>
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

        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{place.formatted_address}</p>

        {/* Ratings & Status (Only show if available) */}
        {(place.rating || place.isOpenNow !== undefined) && (
          <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
            {place.rating && (
              <div className="flex items-center gap-1.5">
                <div className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-sm font-bold flex items-center gap-1">
                  {place.rating} <Star size={12} fill="currentColor" />
                </div>
                {place.user_ratings_total && (
                  <span className="text-xs text-gray-400">({place.user_ratings_total} reviews)</span>
                )}
              </div>
            )}

            {place.isOpenNow !== undefined && (
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${place.isOpenNow ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {place.isOpenNow ? 'Open Now' : 'Closed'}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-emerald-200 shadow-md"
            >
              <ArrowRightCircle size={18} /> GO
            </button>
          )}

          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              <Globe size={16} /> Website
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.formatted_address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors ${!place.website ? 'col-span-2' : ''}`}
          >
            <Navigation size={16} /> Google Maps
          </a>
        </div>

        {/* Reviews Snippet */}
        {place.reviews && place.reviews.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase">
              <MessageSquare size={12} /> Recent Review
            </div>
            <div className="flex gap-2 items-start">
              <img src={place.reviews[0].profile_photo_url} alt="User" className="w-6 h-6 rounded-full" />
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-medium text-gray-900">{place.reviews[0].author_name}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={8} fill={i < place.reviews![0].rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 italic line-clamp-3">"{place.reviews[0].text}"</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceDetailCard;
