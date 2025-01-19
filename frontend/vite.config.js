import { defineConfig } from 'vite';

export default defineConfig({
	base: './', // Basis für relative Pfade
	server: {
		port: 8080, // Port für den Entwicklungsserver
	},
});
