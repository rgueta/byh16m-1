import { Injectable } from "@angular/core";
import Dexie, { Table } from "dexie";

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
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class AppDB extends Dexie {
  information!: Table<Information, number>;

  constructor() {
    super("Byh16Database");
    // Definimos los índices. updatedAt es vital para la sincronización.
    this.version(1).stores({
      information: "id, updatedAt, createdAt, title",
    });
  }

  // Métodos para persistir el timestamp de la última consulta
  setLastSync(timestamp: string) {
    localStorage.setItem("last_sync_timestamp", timestamp);
  }

  getLastSync(): string {
    return (
      localStorage.getItem("last_sync_timestamp") || "1970-01-01T00:00:00Z"
    );
  }
}
