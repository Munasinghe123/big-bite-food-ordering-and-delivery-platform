import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_PAYMENT_SUCCESS_SECRET': JSON.stringify(process.env.VITE_PAYMENT_SUCCESS_SECRET || 'default-secret'),
  },
});