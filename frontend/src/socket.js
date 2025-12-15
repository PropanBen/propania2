import { io } from "socket.io-client";
import API_BASE from "./config/api";

export const socket = io(API_BASE, {
	withCredentials: true,
	transports: ["polling", "websocket"],
});

// Debug-Logging
socket.on("connect", () => console.log("Socket connected", socket.id));
socket.on("connect_error", (err) => console.error("Socket connect_error", err));
socket.on("disconnect", (reason) => console.log("Socket disconnected", reason));
