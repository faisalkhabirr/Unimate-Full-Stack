import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Remove chunkSizeWarningLimit (it only changes warning threshold).
    // Use manualChunks to split vendors into smaller bundles so minification
    // & bundling use less memory and chunks stay under limits.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor.react'
            if (id.includes('lodash')) return 'vendor.lodash'
            // group other large libs into a vendor chunk
            return 'vendor'
          }
        },
      },
    },
  },
})
