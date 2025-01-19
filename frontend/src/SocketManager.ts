import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

class SocketManager {
	private socket: Socket;

	constructor() {
		this.socket = io();
	}

	sendPlayerMove(data: unknown) {
		this.socket.emit('playerMove', data);
	}

	onPlayerMoved(callback: () => unknown) {
		this.socket.on('playerMoved', callback);
	}
}

export default new SocketManager();
