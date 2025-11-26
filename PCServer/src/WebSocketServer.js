const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketServer extends EventEmitter {
  constructor(port = 7700) {
    super();
    this.port = port;
    this.wss = null;
    this.clients = new Set();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`📱 Yeni bağlantı: ${clientIp}`);
      
      this.clients.add(ws);
      this.emit('clientConnected', ws);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.emit('message', message, ws);
          
          if (message.type === 'status') {
            console.log(`📨 Durum: ${message.payload?.status || 'bilinmiyor'}`);
          }
        } catch (error) {
          console.error('Mesaj parse hatası:', error.message);
        }
      });

      ws.on('close', () => {
        console.log(`📴 Bağlantı kapandı: ${clientIp}`);
        this.clients.delete(ws);
        this.emit('clientDisconnected', ws);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket hatası: ${error.message}`);
        this.clients.delete(ws);
      });
    });

    this.wss.on('error', (error) => {
      console.error(`❌ Server hatası: ${error.message}`);
    });

    console.log(`🚀 WebSocket sunucusu başlatıldı: ws://localhost:${this.port}`);
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  sendToClient(client, message) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('🛑 WebSocket sunucusu durduruldu');
    }
  }
}

module.exports = WebSocketServer;
