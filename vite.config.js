import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy keeps the OpenRouter key out of the browser and sidesteps CORS.
// ponytail: dev-server only; ship a serverless function for the same path when deploying.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/decisions': {
          target: 'https://openrouter.ai',
          changeOrigin: true,
          rewrite: () => '/api/alpha/decisions',
          headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
        },
      },
    },
  }
})
