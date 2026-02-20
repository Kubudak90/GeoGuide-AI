interface EnvConfig {
  VITE_API_KEY: string;
  VITE_MAPTILER_KEY: string;
  VITE_TOMTOM_KEY: string;
}

export const env: EnvConfig = {
  VITE_API_KEY: import.meta.env.VITE_API_KEY || '',
  VITE_MAPTILER_KEY: import.meta.env.VITE_MAPTILER_KEY || '',
  VITE_TOMTOM_KEY: import.meta.env.VITE_TOMTOM_KEY || '',
};

export const validateEnv = (): string[] => {
  const missing: string[] = [];
  if (!env.VITE_API_KEY) missing.push('VITE_API_KEY (Google Gemini)');
  if (!env.VITE_MAPTILER_KEY) missing.push('VITE_MAPTILER_KEY (MapTiler)');
  return missing;
};
