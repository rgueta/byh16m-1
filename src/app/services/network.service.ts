import { Injectable, NgZone } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BehaviorSubject, Observable, from, of } from 'rxjs'; // Import 'from' and 'of'
import { Platform } from '@ionic/angular';
import { switchMap, catchError } from 'rxjs/operators'; // Import operators

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private networkStatusSubject: BehaviorSubject<ConnectionStatus> = new BehaviorSubject<ConnectionStatus>({ connected: false, connectionType: 'unknown' });
  public networkStatus$: Observable<ConnectionStatus> = this.networkStatusSubject.asObservable();

  constructor(private platform: Platform, private ngZone: NgZone) {
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    await this.platform.ready();

    // Obtener el estado inicial
    const initialStatus = await Network.getStatus();
    this.updateNetworkStatus(initialStatus);

    // Escuchar cambios
    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      this.ngZone.run(() => {
        this.updateNetworkStatus(status);
      });
    });
  }

  private updateNetworkStatus(status: ConnectionStatus) {
    this.networkStatusSubject.next(status);
    localStorage.setItem('netStatus', status.connected? 'true' : 'false' )
  }

  /**
   * Retorna el estado actual de la conexión de red como un Observable.
   * Utiliza el BehaviorSubject para dar el valor actual inmediatamente.
   */
  public getNetworkStatusObservable(): Observable<ConnectionStatus> {
    return this.networkStatus$;
  }

  /**
   * Retorna el estado actual de la conexión de red como una Promesa (útil para checks únicos).
   */
  public async getCurrentNetworkStatus(): Promise<ConnectionStatus> {
    return await Network.getStatus();
  }

  /**
   * Retorna true si hay conexión a Internet, false en caso contrario.
   */
  public isOnline(): boolean {
    return this.networkStatusSubject.getValue().connected;
  }

  /**
   * Verifica la conexión a Internet y devuelve un Observable<boolean>.
   * Esto es útil para encadenar operaciones con llamadas a la API.
   * Agrega un pequeño "ping" a un sitio confiable para una verificación más robusta
   * que solo la verificación local del dispositivo.
   */
  public checkInternetConnection_(): Observable<boolean> {
    console.log('Entre a la verificacion netword_ ...');

    return from(this.getCurrentNetworkStatus()).pipe(
      switchMap(status => {
        console.error('verificacion netword antes del IF');
        if (!status.connected) {
          console.error('verificacion netword...FALSE');
          return of(false); // No hay conexión local
        } else {
          console.error('verificacion netword...TRUE');
          // Opcional: Intentar un ping a un sitio confiable para una verificación más profunda
          // Esto puede tardar un poco y agregar latencia
          return from(fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
            .then(() => true)
            .catch(() => false)
          ).pipe(
            catchError(() => of(false)) // En caso de cualquier error con fetch, asumir offline
          );
        }
      }),
      catchError(() => of(false)) // En caso de error al obtener el estado de la red del Capacitor
    );
  }

  public checkInternetConnection(){
    return this.getCurrentNetworkStatus()
    .then((status) => {
      return status.connected
    })
    .catch((e) =>{
      catchError(() => of(false)) 
      console.error('Error :' + e.message());
      return of(false);
    });
  }

}