import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class WsService {
  socket!: WebSocket;
  url = environment.cloud.wsIp; // ej: wss://miapp.com/ws

  constructor() {}

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("✅ WebSocket conectado");
    };

    this.socket.onmessage = (event) => {
      console.log("📩 Servidor:", event.data);
    };

    this.socket.onerror = (err) => {
      console.error("❌ WebSocket error", err);
    };

    this.socket.onclose = () => {
      console.warn("⚠️ WebSocket cerrado");
    };
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error("Socket no conectado");
    }
  }
}
