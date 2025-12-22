import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Place } from '../types';

interface PlaceChipProps {
    place: Place;
    onClick: (place: Place) => void;
}

const PlaceChip: React.FC<PlaceChipProps> = ({ place, onClick }) => {
    return (
        <motion.button
            onClick={() => onClick(place)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="relative flex items-center gap-3 glass rounded-2xl p-4 min-h-[72px] shadow-md hover:shadow-xl transition-all text-left group w-full max-w-xs overflow-hidden"
        >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-emerald-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
            <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-slate-800 -z-10"></div>

            {/* Animated background gradient */}
            <motion.div
                className="absolute inset-0 gradient-ocean opacity-0 group-hover:opacity-10 transition-opacity"
                initial={false}
            />

            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-12 h-12 gradient-emerald rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg glow"
            >
                <MapPin size={22} />
            </motion.div>

            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate mb-0.5">{place.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">{place.category}</p>
            </div>

            <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <ArrowRight size={18} className="text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors" />
            </motion.div>
        </motion.button>
    );
};

export default PlaceChip;
