import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['electron-store', 'conf', 'env-paths', 'atomically',
                  'ajv', 'ajv-formats', 'json-schema-typed', 'dot-prop',
                  'debounce-fn', 'semver']
      })
    ],
    build: {
      outDir: 'out/main',
      lib: {
        entry: {
          index: resolve(__dirname, 'electron/main.ts'),
          'web-preload': resolve(__dirname, 'electron/web-preload.ts')
        }
      },
      rollupOptions: {
        external: ['node-pty', 'electron']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts')
      },
      rollupOptions: {
        output: {
          entryFileNames: 'index.js'
        }
      }
    }
  },
  renderer: {
    root: '.',
    plugins: [react()],
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    }
  }
})
