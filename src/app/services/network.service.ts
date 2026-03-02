import { Injectable, NgZone } from "@angular/core";
import { Network, ConnectionStatus } from "@capacitor/network";
import { BehaviorSubject, Observable, from, of } from "rxjs"; // Import 'from' and 'of'
import { Platform } from "@ionic/angular";
import { switchMap, catchError } from "rxjs/operators"; // Import operators
import { ToolsService } from "../services/tools.service";

@Injectable({
  providedIn: "root",
})
export class NetworkService {
  private networkStatusSubject: BehaviorSubject<ConnectionStatus> =
    new BehaviorSubject<ConnectionStatus>({
      connected: false,
      connectionType: "unknown",
    });
  public networkStatus$: Observable<ConnectionStatus> =
    this.networkStatusSubject.asObservable();

  constructor(
    private platform: Platform,
    private ngZone: NgZone,
    private toolsService: ToolsService
  ) {
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    await this.platform.ready();

    try {
      // Obtener el estado inicial
      const initialStatus = await Network.getStatus();
      console.log("[NetworkService] estado inicial:", initialStatus);
      this.updateNetworkStatus(initialStatus);

      // Escuchar cambios - CORREGIDO: Ahora actualiza el BehaviorSubject
      Network.addListener("networkStatusChange", (status: ConnectionStatus) => {
        // Usar NgZone para asegurar que Angular detecte los cambios
        this.ngZone.run(() => {
          this.updateNetworkStatus(status);
        });
      });

      console.log("[NetworkService] listener de red configurado correctamente");
    } catch (error) {
      console.error(
        "[NetworkService] Error al inicializar monitoreo de red:",
        error
      );
    }
  }

  private updateNetworkStatus = async (status: ConnectionStatus) => {
    this.networkStatusSubject.next(status);

    // Guardar en secure storage
    this.toolsService
      .setSecureStorage("netStatus", status.connected)
      .catch((err) =>
        console.error("Error guardando status en secure storage:", err)
      );

    if (
      !(await this.toolsService.getSecureStorage<boolean>("netStatus", false))
    ) {
      console.error(`No Internet`);
    } else {
      console.log(`Si hay Internet`);
    }
  };

  /**
   * Retorna el estado actual de la conexión de red como un Observable.
   */
  public getNetworkStatusObservable(): Observable<ConnectionStatus> {
    return this.networkStatus$;
  }

  /**
   * Retorna el estado actual de la conexión de red como una Promesa.
   */
  public async getCurrentNetworkStatus(): Promise<ConnectionStatus> {
    return await Network.getStatus();
  }

  /**
   * Retorna true si hay conexión a Internet.
   */
  public isOnline(): boolean {
    return this.networkStatusSubject.getValue().connected;
  }

  /**
   * Verifica la conexión a Internet con un ping a un sitio confiable.
   */
  // public checkInternetConnection_(): Observable<boolean> {
  //   console.log("Verificando conexión a Internet...");

  //   return from(this.getCurrentNetworkStatus()).pipe(
  //     switchMap((status) => {
  //       if (!status.connected) {
  //         console.log("Verificación: sin conexión local");
  //         return of(false);
  //       } else {
  //         console.log("Verificación: con conexión local, probando ping...");
  //         return from(
  //           fetch("https://www.google.com/favicon.ico", {
  //             mode: "no-cors",
  //             cache: "no-cache",
  //             timeout: 5000, // Timeout de 5 segundos
  //           })
  //             .then(() => {
  //               console.log("Ping exitoso");
  //               return true;
  //             })
  //             .catch((error) => {
  //               console.log("Ping falló:", error);
  //               return false;
  //             })
  //         ).pipe(catchError(() => of(false)));
  //       }
  //     }),
  //     catchError((error) => {
  //       console.error("Error en checkInternetConnection:", error);
  //       return of(false);
  //     })
  //   );
  // }

  public checkInternetConnection() {
    return this.getCurrentNetworkStatus()
      .then((status) => {
        return status.connected;
      })
      .catch((e) => {
        catchError(() => of(false));
        console.error("Error :" + e.message());
        return of(false);
      });
  }
}
