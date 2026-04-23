import { Injectable, inject } from "@angular/core";
import { AppDB } from "./db.service";
import { firstValueFrom } from "rxjs";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { DatabaseService } from "../services/database.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class SyncService {
  private http = inject(HttpClient);
  private api = inject(DatabaseService);
  private db = inject(AppDB);

  private apiURL = environment.cloud.server_url;

  async syncInfo() {
    this.checkPath();
    const lastSync = this.db.getLastSync("information");

    try {
      // 1. Consultar solo datos modificados/creados desde el último sync
      const news: any = await firstValueFrom(
        this.api.getData(`api/info/recent/${lastSync}/50`)
      );

      if (news.length > 0) {
        // guadamos las imagenes localmente
        for (const item of news) {
          // Generamos la URL completa de R2/Worker
          const remoteUrl = item.path + encodeURIComponent(item.image);
          // const remoteUrl = encodeURIComponent(item.image);

          // Descargamos y guardamos localmente
          const localUri = await this.downloadAndSaveImage(
            remoteUrl,
            item.image
          );

          // 2. Guardar en IndexedDB (bulkPut actualiza si existe el ID o inserta si es nuevo)
          // Guardamos en IndexedDB con la nueva ruta local
          await this.db.information.put({
            ...item,
            localPath: localUri, // Nuevo campo para la ruta del filesystem
          });
        }

        // 3. Obtener el updatedAt más reciente de los nuevos datos para el próximo sync
        const latestUpdate = news.reduce(
          (max: any, item: any) =>
            item.updatedAt > max ? item.updatedAt : max,
          lastSync
        );

        this.db.setLastSync("information", latestUpdate);
        console.log(`Sincronizados ${news.length} registros nuevos.`);
      }
    } catch (error) {
      console.error("Error en la sincronización:", error);
    }
  }

  async syncCodes(userId: string) {
    this.checkPath();
    const lastSync = this.db.getLastSync("codes");

    try {
      // 1. Consultar solo datos modificados/creados desde el último sync
      const codes: any = await firstValueFrom(
        this.api.getData(`api/codes/recent/${userId}/${lastSync}/50`)
      );

      console.log("codes: ", codes);

      if (codes.length > 0) {
        // guadamos las imagenes localmente

        await this.db.codes.bulkPut(codes);

        // 2. Obtener el updatedAt más reciente de los nuevos datos para el próximo sync
        const latestUpdate = codes.reduce(
          (max: any, item: any) =>
            item.createdAt > max ? item.createdAt : max,
          lastSync
        );

        console.log("code,latestUpdate: ", latestUpdate);

        this.db.setLastSync("codes", latestUpdate);
        console.log(`Sincronizados ${codes.length} registros nuevos.`);
      }
    } catch (error) {
      console.error("Error en la sincronización:", error);
    }
  }

  async syncCodeEvents(userId: string) {
    this.checkPath();
    const lastSync = this.db.getLastSync("codeEvents");

    try {
      // 1. Consultar solo datos modificados/creados desde el último sync
      const codeEvents: any = await firstValueFrom(
        this.api.getData(`api/codeEvent/recent/${userId}/${lastSync}/50`)
      );

      console.log("codeEvents: ", codeEvents);

      if (codeEvents.length > 0) {
        // guadamos las imagenes localmente

        await this.db.codeEvents.bulkPut(codeEvents);

        // 2. Obtener el updatedAt más reciente de los nuevos datos para el próximo sync
        const latestUpdate = codeEvents.reduce(
          (max: any, item: any) =>
            item.createdAt > max ? item.createdAt : max,
          lastSync
        );

        console.log("codeEvents,latestUpdate: ", latestUpdate);

        this.db.setLastSync("codeEvents", latestUpdate);
        console.log(`Sincronizados ${codeEvents.length} registros nuevos.`);
      }
    } catch (error) {
      console.error("Error en la sincronización:", error);
    }
  }

  // async synchronize_org() {
  //   const lastSync = this.db.getLastSync("information");

  //   try {
  //     // 1. Consultar solo datos modificados/creados desde el último sync
  //     const news = await firstValueFrom(
  //       this.http.get<Information[]>(
  //         `${this.apiURL}api/info/recent/${lastSync}/50`
  //       )
  //     );

  //     console.log("news: ", news);

  //     for (const item of news) {
  //       // Generamos la URL completa de R2/Worker
  //       const remoteUrl = item.path + encodeURIComponent(item.image);
  //       console.log("item.path: ", item.path);
  //       console.log("item.image: ", item.image);
  //       console.log("remoteUrl: ", remoteUrl);

  //       // Descargamos y guardamos localmente
  //       const localUri = await this.downloadAndSaveImage(remoteUrl, item.image);

  //       // Guardamos en IndexedDB con la nueva ruta local
  //       console.log("localUri: ", localUri);
  //       await this.db.information.put({
  //         ...item,
  //         localPath: localUri, // Nuevo campo para la ruta del filesystem
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error en la sincronización:", error);
  //   }
  // }

  // Método para obtener todos los datos locales para la UI
  async getLocalInformation() {
    try {
      const data = await this.db
        .table("information")
        .orderBy("id")
        .reverse()
        .toArray();

      return data;
    } catch (err) {
      console.error("Error crítico en Dexie:", err);
      return [];
    }
  }

  async getLocalCodes() {
    try {
      const data = await this.db
        .table("codes")
        .orderBy("id")
        .reverse()
        .toArray();

      return data;
    } catch (err) {
      console.error("Error crítico en Dexie:", err);
      return [];
    }
  }

  async getLocalcodeEvents() {
    try {
      const data = await this.db
        .table("codeEvents")
        .orderBy("id")
        .reverse()
        .toArray();

      return data;
    } catch (err) {
      console.error("Error crítico en Dexie:", err);
      return [];
    }
  }

  async downloadAndSaveImage(
    imageUrl: string,
    fileName: string
  ): Promise<string> {
    try {
      // formacion de folder
      // 2. Separar el directorio del nombre del archivo
      // 'pathOnly' será "MX.BC.TJ.6.CG.SJ/42026"
      // 'fileName' será "1776716228456.jpg"
      const lastSlashIndex = fileName.lastIndexOf("/");
      const pathOnly = fileName.substring(0, lastSlashIndex);
      const file = fileName.substring(lastSlashIndex + 1);

      // 1. Descargar la imagen como un Blob
      const blob: any = await firstValueFrom(
        // this.http.get(imageUrl, { responseType: "blob" })
        this.api.getData(`api/r2/get/${encodeURIComponent(fileName)} `, "blob")
      );

      // 2. Convertir Blob a Base64 (requerido por el plugin Filesystem)
      const base64Data = await this.blobToBase64(blob);

      // 3. Escribir el archivo en el almacenamiento del dispositivo
      const savedFile = await Filesystem.writeFile({
        path: `images/${pathOnly}/${file}`,
        data: base64Data,
        directory: Directory.Data,
        recursive: true,
      });

      return savedFile.uri;
    } catch (e) {
      console.error("Error guardando imagen local:", e);
      return imageUrl; // Fallback a la URL remota si falla
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async checkPath() {
    const uri = await Filesystem.getUri({
      path: "images",
      directory: Directory.Data,
    });
    console.log("La ruta real es:", uri.uri);
  }
}
