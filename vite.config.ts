import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite 빌드 및 개발 서버 설정
 */
export default defineConfig(({ mode }) => {
  // 현재 모드(development/production)에 따른 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      // PWA(Progressive Web App) 설정
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: env.VITE_APP_NAME || 'Stockwellness',
          short_name: 'Wellness',
          description: '자산 건강 진단 및 주식 시뮬레이션 서비스',
          theme_color: '#2EBE7A',
          background_color: '#F9FAFB',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    server: {
      hmr: {
        overlay: true, // 에러 발생 시 화면에 오버레이 표시
      },
      // 백엔드 API 프록시 설정
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        // '@' 경로 별칭 설정 (src 디렉토리 참조)
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 빌드 프로세스에 포함할 에셋 확장자 지정
    assetsInclude: ['**/*.svg', '**/*.csv'],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
