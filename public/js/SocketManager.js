import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = io();
  }

  sendPlayerMove(data) {
    this.socket.emit('playerMove', data);
  }

  onPlayerMoved(callback) {
    this.socket.on('playerMoved', callback);
  }
}

export default new SocketManager();
