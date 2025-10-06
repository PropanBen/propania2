import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
	// load the corresponding .env file
	const env = loadEnv(mode, process.cwd(), "");

	return defineConfig({
		base: mode === "production" ? "https://propania2.de/" : "/",
		plugins: [react()],
		server: {
			port: 8080,
			open: true,
			proxy: {
				"/api": {
					target: env.VITE_API_URL,
					changeOrigin: false,
					secure: false,
				},
			},
		},
		build: {
			outDir: "dist",
			sourcemap: mode !== "production",
		},
	});
};
