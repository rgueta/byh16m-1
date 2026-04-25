// services/information.service.ts
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ToolsService } from "../services/tools.service";
import { BehaviorSubject, lastValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

export interface Information {
  id: number;
  title: string;
  url: string;
  path: string;
  key: string;
  description: string;
  location: string;
  size: string;
  like: number;
  disable: boolean;
  metadata?: any;
  isNew?: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: "root" })
export class InformationService {
  private http = inject(HttpClient);
  private toolService = inject(ToolsService);
  REST_API_SERVER = environment.cloud.server_url;
  private apiUrl = this.REST_API_SERVER + "api/r2";
  private informationSubject = new BehaviorSubject<Information[]>([]);
  information$ = this.informationSubject.asObservable();

  private lastSyncDate: string | null = null;
  private storageInitialized = false;

  constructor() {}

  private async initStorage() {
    this.storageInitialized = true;
    this.lastSyncDate = await this.toolService.getSecureStorage<string>(
      "info_last_sync",
      ""
    );
  }

  async getNewInformation(): Promise<Information[]> {
    if (!this.storageInitialized) await this.initStorage();

    try {
      const url = this.lastSyncDate
        ? `${this.apiUrl}?onlyNew=true&lastSync=${this.lastSyncDate}`
        : this.apiUrl;

      const response = await lastValueFrom(
        this.http.get<{ success: boolean; data: Information[] }>(url)
      );

      if (!response.success) return [];

      const newItems = response.data.map((item: any) => ({
        ...item,
        isNew: true,
      }));

      const currentItems = this.informationSubject.value;
      this.informationSubject.next([...newItems, ...currentItems]);

      if (newItems.length > 0) {
        this.lastSyncDate = new Date().toISOString();
        await this.toolService.setSecureStorage(
          "info_last_sync",
          this.lastSyncDate
        );
      }

      return newItems;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  async loadAllInformation(): Promise<Information[]> {
    try {
      const response = await lastValueFrom(
        this.http.get<{ success: boolean; objects: Information[] }>(
          this.apiUrl + "/list"
        )
      );

      if (response.success) {
        this.informationSubject.next(response.objects);
        return response.objects;
      }
      return [];
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  async createInformation(data: {
    titulo: string;
    descripcion?: string;
    link?: string;
    categoria?: string;
    usuario_id?: number;
    metadata?: any;
    imageFile: File;
  }): Promise<Information> {
    const formData = new FormData();
    formData.append("titulo", data.titulo);
    if (data.descripcion) formData.append("descripcion", data.descripcion);
    if (data.link) formData.append("link", data.link);
    if (data.categoria) formData.append("categoria", data.categoria);
    if (data.usuario_id)
      formData.append("usuario_id", data.usuario_id.toString());
    if (data.metadata)
      formData.append("metadata", JSON.stringify(data.metadata));
    formData.append("image", data.imageFile);

    const response = await lastValueFrom(
      this.http.post<{ success: boolean; data: Information }>(
        this.apiUrl,
        formData
      )
    );

    if (response.success) {
      const current = this.informationSubject.value;
      this.informationSubject.next([response.data, ...current]);
      return response.data;
    }

    throw new Error("Error creating information");
  }

  async updateInformation(
    id: number,
    data: Partial<Information> & { imageFile?: File }
  ): Promise<Information> {
    const formData = new FormData();
    if (data.title) formData.append("titulo", data.title);
    if (data.description) formData.append("descripcion", data.description);
    if (data.url) formData.append("link", data.url);
    // if (data.categoria) formData.append("categoria", data.categoria);
    if (data.metadata)
      formData.append("metadata", JSON.stringify(data.metadata));
    if (data.imageFile) formData.append("image", data.imageFile);

    const response = await lastValueFrom(
      this.http.put<{ success: boolean; data: Information }>(
        `${this.apiUrl}/${id}`,
        formData
      )
    );

    if (response.success) {
      const current = this.informationSubject.value;
      const index = current.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        current[index] = response.data;
        this.informationSubject.next([...current]);
      }
      return response.data;
    }

    throw new Error("Error updating information");
  }

  async deleteInformation(id: number): Promise<void> {
    const response = await lastValueFrom(
      this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`)
    );

    if (response.success) {
      const current = this.informationSubject.value;
      this.informationSubject.next(
        current.filter((item: any) => item.id !== id)
      );
    } else {
      throw new Error("Error deleting information");
    }
  }

  async forceRefresh(): Promise<void> {
    if (!this.storageInitialized) await this.initStorage();
    this.lastSyncDate = null;
    await this.toolService.removeSecureStorage("info_last_sync");
    await this.loadAllInformation();
  }
}
