import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        process.env.NODE_ENV = 'test'; // prevents standalone listen on separate port
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api')) {
            try {
              const mod = await server.ssrLoadModule('./server/index.ts');
              return mod.default(req, res, next);
            } catch (err) {
              console.error('API middleware error:', err);
              return next(err);
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
