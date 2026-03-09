import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';

function kimiProxyPlugin(apiKey: string): Plugin {
  return {
    name: 'kimi-proxy',
    configureServer(server) {
      // Handle CORS preflight first
      server.middlewares.use('/api/kimi', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          res.end();
          return;
        }
        next();
      });

      server.middlewares.use('/api/kimi', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const authHeader = req.headers.authorization || `Bearer ${apiKey}`;

            // Use curl which respects the system proxy
            const curlCmd = `curl -s -X POST https://api.kimi.com/coding/v1/chat/completions ` +
              `-H "Content-Type: application/json" ` +
              `-H "Authorization: ${authHeader}" ` +
              `-H "User-Agent: claude-code/1.0" ` +
              `-d '${body.replace(/'/g, "'\\''")}'`;

            const result = execSync(curlCmd, {
              timeout: 120000,
              maxBuffer: 10 * 1024 * 1024
            });

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(result);
          } catch (err: any) {
            console.error('Kimi proxy error:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: err.message } }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const kimiApiKey = env.MOONSHOT_API_KEY || env.VITE_API_KEY || '';

  return {
    server: {
      port: 3000,
      host: true,
    },
    plugins: [
      kimiProxyPlugin(kimiApiKey),
      react()
    ],
    build: {
      target: 'esnext'
    },
    esbuild: {
      target: 'esnext'
    },
    define: {
      'process.env': {
        API_KEY: kimiApiKey,
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
