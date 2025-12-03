import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
export default defineConfig({
  plugins: [
    react(),
    // sourceIdentifierPlugin({
    //   enabled: !isProd,
    //   attributePrefix: 'data-matrix',
    //   includeProps: true,
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

