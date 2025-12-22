import React from 'react';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2.5 rounded-xl glass shadow-md hover:shadow-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center group"
      aria-label="Toggle language"
      title={language === 'tr' ? t('language.english') : t('language.turkish')}
    >
      {/* Background glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 blur-lg -z-10"
      />

      {/* Icon container with rotation animation */}
      <div className="relative flex items-center gap-1">
        <Languages
          size={18}
          className="text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors"
        />
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase"
        >
          {language}
        </motion.span>
      </div>
    </motion.button>
  );
};

export default LanguageToggle;
