import { Injectable } from "@angular/core";
import { AlertController, ToastController } from "@ionic/angular";
import { Preferences } from "@capacitor/preferences";
import { Observable, from, of } from "rxjs";
import { map, catchError } from "rxjs/operators";

const netStatus = "netStatus";

@Injectable({
  providedIn: "root",
})
export class ToolsService {
  constructor(
    private alertCtrl: AlertController,
    public toast: ToastController
  ) {}

  // -------- secure storage  ---------------------------
  // Guardar authToken
  async setSecureStorage(key: string, value: string): Promise<string | null> {
    await Preferences.set({
      key: key,
      value: value,
    });
    return value;
  }

  // Obtener token Promise
  async getSecureStorageP(key: string): Promise<string | null> {
    let storedValue: string | null = null;
    const { value } = await Preferences.get({ key: key });
    storedValue = value;
    return storedValue;
  }

  // Obtener token Observable
  getSecureStorage(key: string): Observable<string | null> {
    // Usamos 'from' para convertir la promesa de Capacitor en un Observable
    return from(Preferences.get({ key: key })).pipe(
      map(({ value }) => {
        if (value !== null) {
          return value;
        } else {
          console.log("No se encontró el token.");
          return null;
        }
      }),
      catchError((error) => {
        console.error(`Fallo Obtener token ${key}:`, error);
        return of(null); // Retorna null en caso de error
      })
    );
  }

  // ----------------------------------------------------
  async showAlertBasic(
    Header: string,
    subHeader: string,
    msg: string,
    btns: any
  ) {
    const alert = await this.alertCtrl.create({
      header: Header,
      subHeader: subHeader,
      message: msg,
      buttons: btns,
    });

    await alert.present();
  }

  async toastAlert(
    msg: string,
    duration: number,
    btns: any,
    position: "top" | "middle" | "bottom"
  ) {
    const myToast = await this.toast.create({
      message: msg,
      duration: duration,
      buttons: btns,
      position: position,
    });
    myToast.present();
  }

  async verifyNetStatus() {
    const cnnStatus = localStorage.getItem("netStatus");
    // if(!cnnStatus!.connected)
    if (true == true) {
      //just to continue migration  --------
      return false;
    } else {
      return true;
    }
  }
}
