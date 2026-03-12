import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: true,
    },
    plugins: [react()],
    // Fix for __publicField error in newer libraries
    build: {
      target: 'esnext'
    },
    esbuild: {
      target: 'esnext'
    },
    define: {
      'process.env': {
        API_KEY: env.KIMI_API_KEY || env.VITE_API_KEY || '',
        KIMI_API_KEY: env.KIMI_API_KEY || env.VITE_API_KEY || ''
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});