import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB limit for better offline support
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2,json,webmanifest}']
      },

      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: true,
      },

      // Comprehensive PWA manifest for all platforms
      manifest: {
        id: '/afuchat',
        name: 'AfuChat',
        short_name: 'AfuChat',
        description: 'Post. Chat. Shop. AI. All in One. Fast, offline-first social platform.',
        theme_color: '#00C2CB',
        background_color: '#000000',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
        orientation: 'portrait-primary',
        start_url: '/?source=pwa',
        scope: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['social', 'communication', 'lifestyle', 'shopping'],
        prefer_related_applications: false,
        
        // Icons for all platforms and sizes
        icons: [
          {
            src: '/favicon.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        
        // App shortcuts for quick actions
        shortcuts: [
          {
            name: 'Home Feed',
            short_name: 'Home',
            description: 'Go to your home feed',
            url: '/home?source=shortcut',
            icons: [{ src: '/favicon.png', sizes: '192x192' }]
          },
          {
            name: 'Messages',
            short_name: 'Chats',
            description: 'Open your messages',
            url: '/chats?source=shortcut',
            icons: [{ src: '/favicon.png', sizes: '192x192' }]
          },
          {
            name: 'New Post',
            short_name: 'Post',
            description: 'Create a new post',
            url: '/?action=new-post&source=shortcut',
            icons: [{ src: '/favicon.png', sizes: '192x192' }]
          },
          {
            name: 'Notifications',
            short_name: 'Alerts',
            description: 'View your notifications',
            url: '/notifications?source=shortcut',
            icons: [{ src: '/favicon.png', sizes: '192x192' }]
          }
        ],

        // Screenshots for app store presentation
        screenshots: [
          {
            src: '/logo.jpg',
            sizes: '540x720',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'AfuChat Home Screen'
          }
        ],

        // Handle share target for receiving shared content
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'media',
                accept: ['image/*', 'video/*']
              }
            ]
          }
        },

        // Protocol handlers
        protocol_handlers: [
          {
            protocol: 'web+afuchat',
            url: '/%s'
          }
        ],

        // Edge side panel
        edge_side_panel: {
          preferred_width: 400
        },

        // Launch handler for better native feel
        launch_handler: {
          client_mode: ['navigate-existing', 'auto']
        },

        // Handle links within the app scope
        handle_links: 'preferred',

        // File handlers (optional)
        file_handlers: [
          {
            action: '/open-file',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
            }
          }
        ]
      },

      // Dev options
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    exclude: [],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
}));
