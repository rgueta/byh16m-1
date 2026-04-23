import { inject, Injectable } from "@angular/core";
import Dexie, { Table } from "dexie";
import { ToolsService } from "./tools.service";
import { environment } from "../../environments/environment";
import { firstValueFrom } from "rxjs";

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

export interface Codes {
  id: number;
  code: string;
  userId: number;
  device_plaform: string;
  initial: string;
  expiry: string;
  enable: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface codeEvents {
  id: number;
  codeId: number;
  coreSim: string;
  doorName: string;
  picId: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class AppDB extends Dexie {
  private toolService = inject(ToolsService);
  information!: Table<Information, number>;
  codes!: Table<Codes, number>;
  codeEvents!: Table<codeEvents, number>;

  constructor() {
    super(environment.app.localDB);
    // Definimos los índices. updatedAt es vital para la sincronización.
    this.version(1).stores({
      information: "id, updatedAt, createdAt, title",
    });

    this.version(1).stores({
      codes: "id, createdAt, userId, expiry",
    });

    this.version(1).stores({
      codeEvents: "id, createdAt",
    });
  }

  async clearDB(table: string) {
    try {
      switch (table) {
        case "information":
          await this.information.clear();
          break;
        case "codes":
          await this.codes.clear();
          break;
      }
      console.log(`✅ Tabla ${table} limpiada correctamente`);
    } catch (error) {
      console.error("❌ Error al limpiar la tabla information:", error);
      throw error;
    }
  }

  // Métodos para persistir el timestamp de la última consulta
  setLastSync(table: string, timestamp: string) {
    switch (table) {
      case "information":
        localStorage.setItem("info_last_sync_timestamp", timestamp);
        break;

      case "codes":
        localStorage.setItem("codes_last_sync_timestamp", timestamp);
        break;

      case "codeEvents":
        localStorage.setItem("codeEvents_last_sync_timestamp", timestamp);
        break;
    }
  }

  getLastSync(table: string): string {
    switch (table) {
      case "information":
        return (
          localStorage.getItem("info_last_sync_timestamp") ||
          "2026-01-01T00:00:00Z"
        );

      case "codes":
        return (
          localStorage.getItem("codes_last_sync_timestamp") ||
          "2026-01-01T00:00:00Z"
        );

      case "codeEvents":
        return (
          localStorage.getItem("codeEvents_last_sync_timestamp") ||
          "2026-01-01T00:00:00Z"
        );

      default:
        return "2026-01-01T00:00:00Z";
    }
  }
}
