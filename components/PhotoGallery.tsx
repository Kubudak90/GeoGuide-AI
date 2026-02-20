import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, MapPin } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  name: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, name }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-300 dark:text-emerald-700">
        <MapPin size={48} />
      </div>
    );
  }

  const goTo = (index: number) => {
    setCurrentIndex((index + photos.length) % photos.length);
  };

  return (
    <>
      <div className="relative w-full h-full group">
        <img
          src={photos[currentIndex]}
          alt={`${name} ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          loading="lazy"
          onClick={() => setFullscreen(true)}
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <ChevronRight size={16} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentIndex ? 'bg-white w-3' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
            onClick={() => setFullscreen(false)}
          >
            <X size={20} />
          </button>
          <img
            src={photos[currentIndex]}
            alt={`${name} fullscreen`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
