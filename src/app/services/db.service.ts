import { Injectable } from "@angular/core";
import Dexie, { Table } from "dexie";
import { environment } from "../../environments/environment";

export interface Information {
  id: number;
  title: string;
  url: string;
  image: string; // El key de R2
  path: string;
  description: string;
  location: string;
  size: number;
  like: number;
  disable: number;
  localPath: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class AppDB extends Dexie {
  information!: Table<Information, number>;
  localDB: string = environment.app.localDB;

  constructor() {
    super(environment.app.localDB);
    // Definimos los índices. updatedAt es vital para la sincronización.
    this.version(1).stores({
      information: "id, updatedAt, createdAt, title",
    });
  }

  async clearDB() {
    try {
      await this.information.clear();
      console.log('✅ Tabla "information" limpiada correctamente');
    } catch (error) {
      console.error("❌ Error al limpiar la tabla information:", error);
      throw error;
    }
  }

  // Métodos para persistir el timestamp de la última consulta
  setLastSync(timestamp: string) {
    localStorage.setItem("last_sync_timestamp", timestamp);
  }

  getLastSync(): string {
    return (
      localStorage.getItem("last_sync_timestamp") || "2026-01-01T00:00:00Z"
    );
  }
}
