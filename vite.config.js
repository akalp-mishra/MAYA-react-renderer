import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  esbuild: {
    jsxFactory: 'maya.createElement',
    jsxFragment: 'maya.Fragment',
  },
})
