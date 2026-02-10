import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const envDir = path.resolve(__dirname, '..');
    const env = loadEnv(mode, envDir, '');
    return {
      server: {
        port: 10000,
        host: '0.0.0.0',
        allowedHosts: ['dolphinmusic.fusionxlink.com'],
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        'process.env.OPENROUTER_MODEL_NAME': JSON.stringify(env.OPENROUTER_MODEL_NAME)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
