import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { BehaviorSubject, from, of, Observable, throwError } from "rxjs";
import { tap, switchMap, catchError } from "rxjs/operators";
import {
  HttpClient,
  HttpHandler,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
} from "@angular/common/http";
import { Router } from "@angular/router";
import { ToolsService } from "../services/tools.service";

const REFRESH_TOKEN = "refreshToken";
const TOKEN = "authToken";
const TOKEN_EXP = "token-exp";
const TOKEN_IAT = "token-iat";
const USERID = "userId";
const USER_ROLES = "roles";
const CORE_SIM = "coreSim";
const CORE_NAME = "coreName";
const LOCATION = "location";

@Injectable({
  providedIn: "root",
})
export class DatabaseService {
  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public currentAuthToken: any;

  private REST_API_SERVER = environment.cloud.server_url;
  collection: String = "";
  public roles: any;
  tokens!: { authToken: ""; refreshToken: ""; coreName: ""; location: "" };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toolService: ToolsService
  ) {
    this.loadToken();
  }

  // Load authToken on startup
  async loadToken() {
    let token = await this.toolService.getSecureStorage<string>(
      "authToken",
      ""
    );

    if (token) {
      this.currentAuthToken = token;
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false);
    }
  }

  // Potentially perform a logout operation inside your API
  // or simply remove all local tokens and navigate to login
  logout() {
    return this.http
      .post(`${this.REST_API_SERVER}api/logout`, {})
      .pipe(
        switchMap((_) => {
          this.currentAuthToken = null;
          console.log("Estoy en database.service logout..");
          // Remove all stored tokens
          // const deleteAccess =
          //   this.toolService.removeSecureStorage("authToken");
          // const deleteRefresh =
          //   this.toolService.removeSecureStorage("refreshToken");
          // return from(Promise.all([deleteAccess, deleteRefresh]));
          //
          return Promise.all([]);
        }),
        tap((_) => {
          this.isAuthenticated.next(false);
          this.router.navigateByUrl("", { replaceUrl: true });
        })
      )
      .subscribe();
  }

  // Load the refresh token from storage
  // then attach it as the header for one specific API call
  async getNewAccessToken() {
    let refreshToken = await this.toolService.getSecureStorage<string>(
      "refreshToken",
      ""
    );

    if (refreshToken != "") {
      const httpOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        }),
      };
      return this.http.get(
        `${this.REST_API_SERVER}api/auth/refresh`,
        httpOptions
      );
    } else {
      // No stored refresh token
      var modals = document.getElementsByTagName("ion-modal");
      [].forEach.call(modals, function (el: any) {
        el.parentNode.removeChild(el);
      });
      this.router.navigateByUrl("", { replaceUrl: true });
      return of(null);
    }
  }
  // Store a new access token
  storeAccessToken(token: any) {
    this.currentAuthToken = token.authToken;

    // secure storage ----------
    if (token.authToken != "" && token.authToken != null) {
      this.toolService.setSecureStorage("authToken", token.authToken);

      this.toolService.setSecureStorage("tokenIAT", token.iatDate);
      this.toolService.setSecureStorage("tokenEXP", token.expDate);
    }

    // get new refresh token-------------
    if (token.refreshToken !== "")
      this.toolService.setSecureStorage("refreshToken", token.refreshToken); //secure storage

    return from(this.currentAuthToken);
    // return from(this.storage.set(TOKEN_KEY, accessToken));
  }

  //---- GET data from server  ------
  //
  getData<T>(
    path: string,
    responseType: "json" | "blob" = "json"
  ): Observable<any> {
    console.log("path: ", path);

    return from(
      this.toolService.getSecureStorage<string>("authToken", "")
    ).pipe(
      switchMap((token: any) => {
        let headers = new HttpHeaders();

        // Lógica de token (se mantiene igual)
        if (!this.toolService.isPublicEndpoint(path)) {
          let tokenString =
            typeof token === "string"
              ? token
              : token?.token || JSON.stringify(token);
          headers = headers.set("Authorization", `Bearer ${tokenString}`);
        }

        // LA CORRECCIÓN: Pasar responseType fuera de headers
        return this.http.get(`${this.REST_API_SERVER}${path}`, {
          headers,
          responseType: responseType as "json", // Se castea para evitar errores de tipo en TS
        });
      }),
      catchError((err) => {
        console.error("Error fetching data:", err);
        return throwError(() => err);
      })
    );
  }

  // getData_old<T>(path: string, responseType = "json"): Observable<T> {
  //   // Convertir la Promise de getSecureStorage a un Observable
  //   //
  //   console.log("path: ", path);
  //   return from(
  //     this.toolService.getSecureStorage<string>("authToken", "")
  //   ).pipe(
  //     // switchMap se suscribe al Observable de `from` y luego al nuevo Observable del `http.get`
  //     switchMap((token: any) => {
  //       let headers = new HttpHeaders();
  //       if (!this.toolService.isPublicEndpoint(path)) {
  //         // headers = headers.set("Authorization", `Bearer ${token}`);
  //         // Asegurarse de que token sea un string
  //         let tokenString = "";
  //         if (typeof token === "string") {
  //           tokenString = token;
  //         } else if (token && typeof token === "object") {
  //           // Si es un objeto, intentar extraer el token
  //           console.log("Token es objeto:", token);
  //           // Intenta con las propiedades más comunes
  //           tokenString =
  //             token.token ||
  //             token.accessToken ||
  //             token.value ||
  //             JSON.stringify(token);
  //           console.log("Token extraído:", tokenString);
  //         } else {
  //           tokenString = String(token);
  //         }

  //         headers = headers.set("Authorization", `Bearer ${tokenString}`);
  //         if (responseType == "blob") {
  //           headers = headers.set(responseType, "blob");
  //         }
  //       } else {
  //         console.log("EndPoint publico...");
  //       }

  //       return this.http.get<T>(`${this.REST_API_SERVER}${path}`, { headers });
  //     }),
  //     // Manejo de errores
  //     catchError((err) => {
  //       console.error("Error fetching data:", err);
  //       if (err.expired) {
  //         console.log("Esta chingadera expiro!");
  //       }
  //       return throwError(() => err);
  //     })
  //   );
  // }

  // --- POST data to server

  async postData_noToken(collection: String, data: any) {
    let options = {
      headers: {
        Accept: "application/json",
        "content-type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT",
      },
    };

    return new Promise((resolve, reject) => {
      this.http
        .post(this.REST_API_SERVER + collection, data, options)
        .subscribe({
          next: (res: any) => {
            resolve(res);
          },
          error: (error: any) => {
            reject(error);
          },
        });
    });
  }

  async postData(collection: String, data: any) {
    // secure storage ------------------
    let token = await this.toolService.getSecureStorage<string>(
      "authToken",
      ""
    );

    let options = {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
    };

    return new Promise((resolve, reject) => {
      this.http
        .post(this.REST_API_SERVER + collection, data, options)
        .subscribe({
          next: (res: any) => {
            resolve(res);
          },
          error: (error: any) => {
            reject(error);
          },
        });
    });
  }

  async postDataInfo(collection: String, data: any, params: {}) {
    // secure storage ------------------
    let token = await this.toolService.getSecureStorage<string>(
      "authToken",
      ""
    );

    let options = {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      params: params,
    };

    return new Promise((resolve, reject) => {
      this.http
        .post(this.REST_API_SERVER + collection, data, options)
        .subscribe({
          next: (res: any) => {
            resolve(res);
          },
          error: (error: any) => {
            reject(error);
          },
        });
    });
  }

  async postRegisterData(url: String, data: any) {
    // secure storage ------------------
    let token = await this.toolService.getSecureStorage<string>(
      "authToken",
      ""
    );

    let options = {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT",
      },
    };

    return new Promise((resolve, reject) => {
      this.http.post(this.REST_API_SERVER + url, data, options).subscribe({
        next: (res: any) => {
          resolve(res);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  }

  postRegister(url: String, data: any) {
    console.log("postRegister ------ ");
    let options = {
      headers: {
        Accept: "application/json",
        "content-type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT",
      },
    };

    return this.http.post(this.REST_API_SERVER + url, data, options);
  }

  //--- PUT data to server
  async putData(collecion: String, data: any) {
    // secure storage ------------------

    let token = await this.toolService.getSecureStorage<string>(
      "authToken",
      ""
    );

    let options = {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
    };

    return new Promise((resolve, reject) => {
      this.http.put(this.REST_API_SERVER + collecion, data, options).subscribe({
        next: (res: any) => {
          resolve(res);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  }

  //--- DELETE data to server
  async deleteData(collection: String) {
    // secure storage ------------------
    let token = await this.toolService.getSecureStorage<string>(
      "authToken",
      ""
    );

    let options = {
      headers: {
        Accept: "application/json",
        authorization: `Bearer ${token}`,
      },
    };

    return new Promise((resolve, reject) => {
      this.http.delete(this.REST_API_SERVER + collection, options).subscribe({
        next: (res: any) => {
          resolve(res);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  }
}

function then(arg0: (Token: any) => void) {
  throw new Error("Function not implemented.");
}
