import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppDB, Information } from "./db.service";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SyncService {
  private http = inject(HttpClient);
  private db = inject(AppDB);
  private readonly API_URL = "http://192.168.1.170:8787/api/info/recent";

  async synchronize() {
    const lastSync = this.db.getLastSync();

    try {
      // 1. Consultar solo datos modificados/creados desde el último sync
      const news = await firstValueFrom(
        this.http.get<Information[]>(`${this.API_URL}/${lastSync}/50`)
      );

      if (news.length > 0) {
        console.log("news: ", news);
        // 2. Guardar en IndexedDB (bulkPut actualiza si existe el ID o inserta si es nuevo)
        await this.db.information.bulkPut(news);

        // 3. Obtener el updatedAt más reciente de los nuevos datos para el próximo sync
        const latestUpdate = news.reduce(
          (max, item) => (item.updatedAt > max ? item.updatedAt : max),
          lastSync
        );

        this.db.setLastSync(latestUpdate);
        console.log(`Sincronizados ${news.length} registros nuevos.`);
      }
    } catch (error) {
      console.error("Error en la sincronización:", error);
    }
  }

  // Método para obtener todos los datos locales para la UI
  getLocalInformation() {
    return this.db.information.orderBy("id").reverse().toArray();
  }
}
