import { io } from "socket.io-client";

// 🔹 API-URL aus .env laden
const API_URL =
	import.meta.env.VITE_APP_ENV === "production"
		? import.meta.env.VITE_API_URL
		: `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

export const socket = io(API_URL, {
	withCredentials: true,
	transports: ["polling", "websocket"],
});

// Debug-Logging
socket.on("connect", () => console.log("Socket connected", socket.id));
socket.on("connect_error", (err) => console.error("Socket connect_error", err));
socket.on("disconnect", (reason) => console.log("Socket disconnected", reason));
