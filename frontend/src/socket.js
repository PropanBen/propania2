import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
	withCredentials: true,
});

// Debug-Logging
socket.on('connect', () => console.log('Socket connected', socket.id));
socket.on('connect_error', (err) => console.error('Socket connect_error', err));
socket.on('disconnect', (reason) => console.log('Socket disconnected', reason));
