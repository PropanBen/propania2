import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		port: 8080, // Port auf 8080 setzen
		open: true, // öffnet den Browser automatisch
	},
});
