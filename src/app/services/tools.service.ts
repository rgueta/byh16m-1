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
  async setSecureStorage(key: string, value: any): Promise<string | null> {
    let errorMessage = "An unknown error occurred.";
    try{
        const serializedValue = this.serialize(key, value);
        await Preferences.set({
          key: key,
          value: serializedValue
        });

        return serializedValue;
      }catch(error){
        console.error('setSecureStorage error:', error);

        if (error instanceof Error) {
            // Standard Error object has a `message` property
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            // The thrown value is a string
            errorMessage = error;
          } else {
            // The thrown value is an object or another type, convert it to a string
            errorMessage = JSON.stringify(error, null, 2);
          }
        return errorMessage;
      }
  }

  // Obtener token Promise
  async getSecureStorageP(key: string): Promise<string | null> {
    let storedValue: string | null = null;
    const { value } = await Preferences.get({ key: key });
    storedValue = value;
    return storedValue;
  }

  // Obtener token Single
   async getSecureStorageS(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error('Error al obtener la preferencia:', error);
      return null;
    }
  }



  // async getSecureStorageS(key: string) {
  //   let storedValue: string | null = null;
  //   const { value } = await Preferences.get({ key: key });
  //   storedValue = value;
  //   return storedValue;
  // }

  // Obtener token Observable
  // getSecureStorage(key: string): Observable<any> {
  //   // Usamos 'from' para convertir la promesa de Capacitor en un Observable
  //   return from(Preferences.get({ key: key })).pipe(
  //     map(({ value }) => {
  //       if (value !== null) {
  //         return value;
  //       } else {
  //         console.log("No se encontró el token.");
  //         return null;
  //       }
  //     }),
  //     catchError((error) => {
  //     console.error(`Fallo Obtener token ${key}:`, error);
  //       return of(null); // Retorna null en caso de error
  //     })
  //   );
  // }

   async getSecureStorage(key: string): Promise<any> {
    try {
      const result = await Preferences.get({ key: key });
      
      if (!result || result.value === null) {
        return result;
      }
      
      return this.deserialize(result.value);
    } catch (error) {
      console.error('Error obteniendo dato:', error);
      return error;
    }
  }

  async getSecureBoolean(key: string): Promise<boolean> {
    const { value } = await Preferences.get({ key: key });
    const result = value === "true" ? true: false;
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


    /**
   * Detecta el tipo de dato para serialización especial
   */
  private detectType(value: any): string {
    if (value instanceof Date) return 'date';
    if (value?.constructor?.name === 'ObjectId') return 'objectid';
    if (value instanceof RegExp) return 'regexp';
    if (value instanceof Map) return 'map';
    if (value instanceof Set) return 'set';
    if (value instanceof ArrayBuffer) return 'buffer';
    if (typeof value === 'bigint') return 'bigint';
    if (value === null) return 'null';
    
    return typeof value;
  }

   /**
   * Serializa cualquier tipo de dato a string
   */
  private serialize(key:string, value: any): string {
    // Manejo especial para tipos complejos
    if (value === undefined || value === null) {
      return JSON.stringify({ type: 'null', value: null });
    }
    
    // Detectar tipo y serializar apropiadamente
    const type = this.detectType(value);
    
    switch (type) {
      case 'date':
        return JSON.stringify({ 
          type: 'date', 
          value: value.toISOString() 
        });
        
      case 'objectid':
        return JSON.stringify({ 
          type: 'objectid', 
          value: value.toString() 
        });
        
      case 'regexp':
        return JSON.stringify({ 
          type: 'regexp', 
          value: { 
            pattern: value.source, 
            flags: value.flags 
          } 
        });
        
      case 'map':
        return JSON.stringify({ 
          type: 'map', 
          value: Array.from(value.entries()) 
        });
        
      case 'set':
        return JSON.stringify({ 
          type: 'set', 
          value: Array.from(value) 
        });
        
      case 'buffer':
        return JSON.stringify({ 
          type: 'buffer', 
          value: Array.from(new Uint8Array(value)) 
        });
        
      case 'bigint':
        return JSON.stringify({ 
          type: 'bigint', 
          value: value.toString() 
        });
        
      default:
        return JSON.stringify({ 
          type: typeof value, 
          value: value 
        });
    }
  }


    /**
   * Deserializa el string al tipo original
   */
  private deserialize<T>(serializedValue: string): T {
    try {
      const parsed = JSON.parse(serializedValue);
      
      if (!parsed || typeof parsed !== 'object') {
        return parsed as T;
      }
      
      // Reconstruir tipos especiales
      switch (parsed.type) {
        case 'date':
          return new Date(parsed.value) as T;
          
        case 'objectid':
          // Si usas MongoDB ObjectId en el frontend
          // return new ObjectId(parsed.value) as T;
          return parsed.value as T; // o mantener como string
          
        case 'regexp':
          return new RegExp(parsed.value.pattern, parsed.value.flags) as T;
          
        case 'map':
          return new Map(parsed.value) as T;
          
        case 'set':
          return new Set(parsed.value) as T;
          
        case 'buffer':
          return new Uint8Array(parsed.value).buffer as T;
          
        case 'bigint':
          return BigInt(parsed.value) as T;
          
        case 'null':
          return null as T;
          
        default:
          return parsed.value as T;
      }
    } catch (error) {
      console.error('Error deserializando:', error);
      return serializedValue as T; // Fallback: devolver como string
    }
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

  async cleanSecureStorage() {
    let myVisitors: string = "";
    let coreId: string = "";
    let refreshToken: string = "";
    let netStatus: string = "";
    let demoMode: boolean = false;

    netStatus = await this.getSecureStorage("netStatus");
    // this.getSecureStorage("netStatus").subscribe({
    //   next: (result) => {
    //     netStatus = result;
    //   },
    //   error: (err) => {
    //     this.toastAlert(
    //       "error, obteniendo netStatus en tool.service.ts getSecureStorage: " +
    //         err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

    myVisitors = await this.getSecureStorage("visitors");
    // this.getSecureStorage("visitors").subscribe({
    //   next: (result) => {
    //     myVisitors = result;
    //   },
    //   error: (err) => {
    //     this.toastAlert(
    //       "error, obteniendo visitors en tool.service.ts getSecureStorage: " +
    //         err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

    coreId = await this.getSecureStorage("coreId");
    // this.getSecureStorage("coreId").subscribe({
    //   next: (result) => {
    //     coreId = result;
    //   },
    //   error: (err) => {
    //     this.toastAlert(
    //       "error, obteniendo coreId en tool.service.ts getSecureStorage: " +
    //         err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });


    refreshToken = await this.getSecureStorage("refreshToken");
    // this.getSecureStorage("refreshToken").subscribe({
    //   next: (result) => {
    //     refreshToken = result;
    //   },
    //   error: (err) => {
    //     this.toastAlert(
    //       "error, obteniendo refreshToken en tool.service.ts getSecureStorage: " +
    //         err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

    demoMode = await this.getSecureStorage("demoMode");
    // this.getSecureStorage("demoMode").subscribe({
    //   next: (result) => {
    //     demoMode = result == "true" ? true : false;
    //     console.log("Valor demoMode antes del clear --> ", demoMode);
    //   },
    //   error: (err) => {
    //     this.toastAlert(
    //       "error, obteniendo demoMode en tool.service.ts getSecureStorage: " +
    //         err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

    await this.clearAllPreferences();
    await this.setSecureStorage("netStatus", netStatus);
    await this.setSecureStorage("visitors", myVisitors);
    await this.setSecureStorage("refreshToken", refreshToken);
    await this.setSecureStorage("coreId", coreId);
    await this.setSecureStorage("demoMode", demoMode.toString());
    console.log(
      "cleanSecureStorage at tools.service.ts, demoMode: ",
      demoMode.toString()
    );
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
