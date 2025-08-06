import { Injectable } from "@angular/core";
import { AlertController, ToastController } from "@ionic/angular";
import { Preferences } from "@capacitor/preferences";
import { Observable, from, of, firstValueFrom } from "rxjs";
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

  // Obtener token Single
  async getSecureStorageS(key: string) {
    let storedValue: string | null = null;
    const { value } = await Preferences.get({ key: key });
    storedValue = value;
    return storedValue;
  }

  // Obtener token Observable
  getSecureStorage(key: string): Observable<any> {
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

  async getSecureBoolean(key: string): Promise<boolean> {
    const { value } = await Preferences.get({ key: key });
    const result = value === "true";
    console.log(`Valor obtenido para la clave '${key}': ${result}`);
    return result;
  }

  // remove single key
  async removeSecureStorage(key: string) {
    await Preferences.remove({
      key: key,
    });
  }

  // clear all Preferences
  async clearAllPreferences() {
    await Preferences.clear();
  }

  // ----------------------------------------------------
  convDate(today: Date) {
    var day: string = ("0" + today.getDate()).slice(-2);
    var month: string = ("0" + (today.getMonth() + 1)).slice(-2);
    var year: string = today.getFullYear().toString();
    var hour: string = ("0" + today.getHours()).slice(-2);
    var minutes: string = ("0" + today.getMinutes()).slice(-2);
    var seconds: string = ("0" + today.getSeconds()).slice(-2);
    var milis: string = ("0" + today.getMilliseconds()).slice(-3);

    return (
      year +
      "-" +
      month +
      "-" +
      day +
      "T" +
      hour +
      ":" +
      minutes +
      ":" +
      seconds +
      "." +
      milis
    );
  }

  sortJSON(arr: any, key: any, asc = true) {
    return arr.sort((a: any, b: any) => {
      let x = a["name"][key];
      let y = b["name"][key];
      if (asc) {
        return x < y ? -1 : x > y ? 1 : 0;
      } else {
        return x > y ? -1 : x < y ? 1 : 0;
      }
    });
  }

  sortJsonVisitors(arr: any, key: any, asc = true) {
    return arr.sort((a: any, b: any) => {
      let x = a[key];
      let y = b[key];
      if (asc) {
        return x < y ? -1 : x > y ? 1 : 0;
      } else {
        return x > y ? -1 : x < y ? 1 : 0;
      }
    });
  }

  cleanSecureStorage() {
    let myVisitors: string = "";
    let coreId: string = "";
    let refreshToken: string = "";
    let netStatus: string = "";

    this.getSecureStorage("netStatus").subscribe({
      next: (result) => {
        netStatus = result;
      },
      error: (err) => {
        this.toastAlert(
          "error, obteniendo netStatus en tool.service.ts getSecureStorage: " +
            err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    this.getSecureStorage("visitors").subscribe({
      next: (result) => {
        myVisitors = result;
      },
      error: (err) => {
        this.toastAlert(
          "error, obteniendo visitors en tool.service.ts getSecureStorage: " +
            err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    this.getSecureStorage("coreId").subscribe({
      next: (result) => {
        coreId = result;
      },
      error: (err) => {
        this.toastAlert(
          "error, obteniendo coreId en tool.service.ts getSecureStorage: " +
            err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    this.getSecureStorage("refreshToken").subscribe({
      next: (result) => {
        refreshToken = result;
      },
      error: (err) => {
        this.toastAlert(
          "error, obteniendo refreshToken en tool.service.ts getSecureStorage: " +
            err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    this.clearAllPreferences();
    this.setSecureStorage("netStatus", netStatus);
    this.setSecureStorage("visitors", myVisitors);
    this.setSecureStorage("refreshToken", refreshToken);
    this.setSecureStorage("coreId", coreId);
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  async convertUTCDateToLocalDate(date: Date) {
    var newDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60 * 1000
    );

    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();

    newDate.setHours(hours - offset);
    return newDate;
  }

  convertLocalDateToUTCDate(date: Date) {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  }

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
}
