import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to add SharePoint ASPX directive
    // Custom plugin to add SharePoint ASPX directive - ONLY in production
    {
      name: 'sharepoint-aspx-header',
      transformIndexHtml: (html) => {
        if (process.env.NODE_ENV === 'production') {
          return '<%@ Page Language="C#" %>\n' + html
        }
        return html;
      }
    }
  ],
  // IMPORTANT: This ensures assets are loaded relative to the index.aspx file
  // instead of from the root domain. This is required for SharePoint.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    port: 5174
  }
})