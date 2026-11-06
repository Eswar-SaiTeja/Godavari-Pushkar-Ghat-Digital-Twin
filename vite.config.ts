import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

function aiBackendPlugin(): Plugin {
  return {
    name: 'godavari-ai-backend-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/ai')) {
          try {
            const router = await server.ssrLoadModule('/server/aiServerRouter.ts');
            const handled = await router.handleAIRequest(req, res);
            if (handled) return;
          } catch (err) {
            console.error('[AI Middleware Error]:', err);
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium(), aiBackendPlugin()],
  server: {
    port: 5173,
    host: true
  }
})
