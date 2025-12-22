import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2.5 rounded-xl glass shadow-md hover:shadow-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center group"
      aria-label="Toggle theme"
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {/* Background glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isDark ? 0.15 : 0.1 }}
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 blur-lg -z-10"
      />

      {/* Icon container with rotation animation */}
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative"
      >
        {isDark ? (
          <Moon
            size={20}
            className="text-purple-400 group-hover:text-purple-300 transition-colors"
          />
        ) : (
          <Sun
            size={20}
            className="text-yellow-600 group-hover:text-yellow-500 transition-colors"
          />
        )}
      </motion.div>

      {/* Rotating ring effect */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-xl"
        style={{
          background: isDark
            ? 'conic-gradient(from 0deg, transparent, rgba(168, 85, 247, 0.2), transparent)'
            : 'conic-gradient(from 0deg, transparent, rgba(251, 191, 36, 0.2), transparent)',
        }}
      />
    </motion.button>
  );
};

export default ThemeToggle;
