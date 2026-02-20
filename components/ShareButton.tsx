import React from 'react';
import { Share2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../i18n';

interface ShareButtonProps {
  name: string;
  lat: number;
  lng: number;
  description?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ name, lat, lng, description, className }) => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?place=${encodeURIComponent(name)}&lat=${lat}&lng=${lng}`;
    const shareData = {
      title: name,
      text: description || name,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        showToast(t('link_copied'), 'success');
      }
    } catch {
      // User cancelled share - do nothing
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className || 'p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center'}
      title={t('share')}
    >
      <Share2 size={20} />
    </button>
  );
};

export default ShareButton;
