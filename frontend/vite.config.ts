import { defineConfig } from 'vite';

export default defineConfig({
	base: './', // Basis für relative Pfade
	server: {
		open: true,
		port: 8080, // Port für den Entwicklungsserver
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				secure: false,
				ws: true, // Aktiviert WebSocket-Proxying
			},
		},
	},
	build: {
		outDir: 'dist', // Ausgabeordner
		sourcemap: true, // Erstelle Sourcemaps für Debugging
		target: 'esnext', // Ziel für moderne Browser
		rollupOptions: {
			input: 'index.html',
		},
	},
});
