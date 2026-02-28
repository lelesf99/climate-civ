import { defineConfig } from 'vite';

export default defineConfig({
    base: '/climate-civ/',
    root: '.',
    build: {
        outDir: 'dist',
    },
    server: {
        port: 3000,
        open: true
    }
});
