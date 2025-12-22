import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaceDetails } from '../types';
import { X, MapPin, Navigation2, Trash2, Heart } from 'lucide-react';

interface FavoritesListProps {
    favorites: PlaceDetails[];
    onClose: () => void;
    onSelect: (place: PlaceDetails) => void;
    onRemove: (place: PlaceDetails) => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onClose, onSelect, onRemove }) => {
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
                className="glass rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header - Gradient */}
                <div className="p-6 border-b border-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 gradient-sunset opacity-10"></div>

                    <div className="flex items-center justify-between relative z-10">
                        <motion.h2
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                            >
                                <Heart size={24} className="text-red-500 fill-red-500" />
                            </motion.div>
                            My Favorites
                        </motion.h2>

                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="glass-dark text-white p-2.5 min-w-[44px] min-h-[44px] rounded-full transition-all flex items-center justify-center"
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    {favorites.length > 0 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium"
                        >
                            {favorites.length} {favorites.length === 1 ? 'place' : 'places'} saved
                        </motion.p>
                    )}
                </div>

                {/* List */}
                <div className="overflow-y-auto p-5 flex-1 modern-scrollbar bg-white/30">
                    {favorites.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="mx-auto w-20 h-20 glass rounded-2xl flex items-center justify-center mb-4"
                            >
                                <Heart size={36} className="text-gray-300 dark:text-gray-600" />
                            </motion.div>
                            <p className="text-gray-600 dark:text-gray-400 font-semibold">No favorites yet</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Start exploring and save places you like!</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {favorites.map((place, index) => (
                                <motion.div
                                    key={`${place.name}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    className="relative flex items-start gap-3 p-4 rounded-2xl glass shadow-md hover:shadow-xl transition-all group overflow-hidden"
                                >
                                    {/* Gradient border on hover */}
                                    <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                                    <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-slate-800 -z-10"></div>

                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.6 }}
                                        className="w-12 h-12 rounded-xl gradient-emerald text-white flex items-center justify-center flex-shrink-0 shadow-lg"
                                    >
                                        <MapPin size={20} />
                                    </motion.div>

                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(place)}>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{place.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.category || 'Place'}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onSelect(place)}
                                            className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                                            title="View on Map"
                                        >
                                            <Navigation2 size={18} />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 10 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onRemove(place)}
                                            className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                                            title="Remove"
                                        >
                                            <Trash2 size={18} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FavoritesList;
