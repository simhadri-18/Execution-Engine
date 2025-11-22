// src/lib/websocket.ts
import WebSocket from "ws";

export class WebSocketManager {
  private clients: Map<string, WebSocket> = new Map();

  constructor() {
    console.log("🔌 WebSocket Manager Initialized");
  }

  addConnection(orderId: string, socket: WebSocket) {
    console.log("🟢 WS Connected:", orderId);
    this.clients.set(orderId, socket);
  }

  removeConnection(orderId: string) {
    console.log("🔴 WS Disconnected:", orderId);
    this.clients.delete(orderId);
  }

  emit(orderId: string, payload: any) {
    const client = this.clients.get(orderId);

    console.log("📤 WS Emit:", orderId, payload);

    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}

export const wsManager = new WebSocketManager();
