import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { FundingRate, ArbitrageOpportunity } from './types';

export class WebServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private port: number;
  private lastData: any = null; // Store last broadcast data

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress(): void {
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Root route
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');
      this.clients.add(ws);

      // Send last data immediately if available
      if (this.lastData && ws.readyState === WebSocket.OPEN) {
        console.log('Sending cached data to new client');
        ws.send(JSON.stringify(this.lastData));
      }

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(data: {
    fundingRates: FundingRate[];
    opportunities: ArbitrageOpportunity[];
    timestamp: number;
  }): void {
    // Cache the data for new clients
    this.lastData = data;

    const message = JSON.stringify(data);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  start(): void {
    this.server.listen(this.port, () => {
      console.log(`\n🌐 Web Dashboard: http://localhost:${this.port}`);
      console.log(`📡 WebSocket Server: ws://localhost:${this.port}\n`);
    });
  }

  stop(): void {
    this.clients.forEach((client) => client.close());
    this.wss.close();
    this.server.close();
  }
}
