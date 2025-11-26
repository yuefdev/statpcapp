import WebSocket, { WebSocketServer as WSServer } from 'ws';
import { EventEmitter } from 'events';

export class WebSocketServer extends EventEmitter {
  private wss: WSServer;
  private clients = new Set<WebSocket>();

  constructor(port: number) {
    super();
    
    // Büyük mesajlar için maxPayload artırıldı (50MB)
    this.wss = new WSServer({ 
      port,
      maxPayload: 50 * 1024 * 1024 // 50MB
    });
    console.log(`🚀 Server running on port ${port}`);

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      this.emit('clientsChanged', this.clients.size);
      this.emit('connection', ws);

      ws.on('close', () => {
        this.clients.delete(ws);
        this.emit('clientsChanged', this.clients.size);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(type: string, payload: any): void {
    const message = JSON.stringify({ type, payload, timestamp: Date.now() });
    const sizeMB = (message.length / 1024 / 1024).toFixed(2);
    console.log(`📤 Broadcast: ${type}, Boyut: ${sizeMB} MB`);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (err) {
          console.error('Send error:', err);
        }
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close(): void {
    this.wss.close();
  }
}
