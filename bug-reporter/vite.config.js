import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/BugReportWidget.jsx'),
      name: 'BugReportWidget',
      fileName: (format) => `bug-report-widget.${format}.js`
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled into your library
      external: ['react', 'react-dom', 'react/jsx-runtime', 'axios'],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          axios: 'axios'
        }
      }
    }
  }
})
