import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { addIcons } from "ionicons";
import { trash, add } from "ionicons/icons";
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
} from "@ionic/angular/standalone";
import {
  InformationService,
  Information,
} from "../../services/information.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { environment } from "../../../environments/environment";
import { SyncService } from "../../services/sync.service";

@Component({
  selector: "app-information",
  templateUrl: "./information.page.html",
  styleUrls: ["./information.page.scss"],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
  ],
})
export class InformationPage implements OnInit {
  private syncService = inject(SyncService);
  private infoService = inject(InformationService);

  // Convertir BehaviorSubject a Signal
  informations = toSignal(this.infoService.information$, {
    initialValue: [] as Information[],
  });

  // O puedes usar signal normal
  isLoading = signal(false);

  REST_API_SERVER = environment.cloud.server_url;

  constructor() {
    addIcons({ trash, add });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.isLoading.set(true);
    try {
      await this.infoService.loadAllInformation();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onCreateInformation() {
    try {
      // Simular creación (ajusta según tu formulario)
      const file = new File([], "imagen.jpg"); // Tu archivo real

      const nuevo = await this.infoService.createInformation({
        titulo: "Nuevo registro",
        descripcion: "Descripción del nuevo registro",
        link: "https://ejemplo.com",
        categoria: "general",
        usuario_id: 1,
        imageFile: file,
      });

      // ✅ No necesitas hacer nada más
      // La signal 'informations' se actualiza automáticamente

      console.log("Creado:", nuevo);
    } catch (error) {
      console.error("Error al crear:", error);
    }
  }

  async onDelete(id: number) {
    try {
      await this.infoService.deleteInformation(id);
      // ✅ La lista se actualiza automáticamente
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  }

  async doRefresh(event: any) {
    try {
      await this.infoService.forceRefresh();
    } catch (error) {
      console.error("Error al refrescar:", error);
    } finally {
      event.target.complete();
    }
  }

  getImageUrl(r2Key: string): string {
    return `${this.REST_API_SERVER}api/r2/view/${encodeURIComponent(r2Key)}`;
  }
}
