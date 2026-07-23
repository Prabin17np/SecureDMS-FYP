import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    https: {
      key: fs.readFileSync('../backend/cert/key.pem'),
      cert: fs.readFileSync('../backend/cert/cert.pem'),
    },
  },
});
