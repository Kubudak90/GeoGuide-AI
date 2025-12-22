import React from 'react';
import { X, Navigation2, Globe, Heart, Star, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place, PlaceDetails } from '../types';

interface PlaceDetailModalProps {
    place: Place;
    onClose: () => void;
    onNavigate: (place: Place) => void;
    onToggleFavorite: (place: PlaceDetails) => void;
    isFavorite: (place: PlaceDetails) => boolean;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose, onNavigate, onToggleFavorite, isFavorite }) => {
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="glass rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
                {/* Header - Gradient Background */}
                <div className="h-40 gradient-ocean relative overflow-hidden">
                    {/* Animated gradient overlay */}
                    <motion.div
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute inset-0 opacity-50"
                        style={{
                            background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                            backgroundSize: '200% 200%',
                        }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute top-4 right-4 glass-dark text-white p-3 min-w-[48px] min-h-[48px] rounded-full transition-all flex items-center justify-center z-10"
                    >
                        <X size={20} />
                    </motion.button>

                    <div className="absolute bottom-4 left-6 text-white z-10">
                        <motion.span
                            initial={{ scale: 0, x: -20 }}
                            animate={{ scale: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block text-xs font-bold bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/40 shadow-lg"
                        >
                            {place.category}
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold mt-2 drop-shadow-lg"
                        >
                            {place.name}
                        </motion.h2>
                    </div>

                    {/* Floating icon */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute top-6 left-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center"
                    >
                        <MapPin size={24} className="text-white" />
                    </motion.div>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 bg-white/50 backdrop-blur-sm"
                >
                    <p className="text-gray-700 leading-relaxed mb-6 font-medium">
                        {place.short_description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNavigate(place)}
                            className="flex-1 gradient-emerald text-white py-3.5 px-4 min-h-[52px] rounded-xl font-bold shadow-lg glow transition-all flex items-center justify-center gap-2 btn-modern"
                        >
                            <Navigation2 size={20} />
                            Go There
                        </motion.button>

                        {place.website && (
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                href={place.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass text-gray-700 p-3.5 min-w-[52px] min-h-[52px] rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
                                title="Visit Website"
                            >
                                <Globe size={22} />
                            </motion.a>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onToggleFavorite(placeForFavorite)}
                            className={`glass p-3.5 min-w-[52px] min-h-[52px] rounded-xl transition-all flex items-center justify-center ${
                                isFav ? 'bg-red-50 text-red-500' : 'text-gray-700 hover:bg-red-50 hover:text-red-500'
                            }`}
                            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                        >
                            <motion.div
                                animate={isFav ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            >
                                <Heart size={22} className={isFav ? "fill-current" : ""} />
                            </motion.div>
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default PlaceDetailModal;
