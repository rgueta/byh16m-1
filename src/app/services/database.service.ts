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
    let token = await this.toolService.getSecureStorage("authToken");
    //   getting role ---------------------------
    // this.toolService.getSecureStorage("authToken").subscribe({
    //   next: (result) => {
    //     token = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo authToken en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

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
      .post(`${this.REST_API_SERVER}api/auth/logout`, {})
      .pipe(
        switchMap((_) => {
          this.currentAuthToken = null;
          // Remove all stored tokens
          const deleteAccess =
            this.toolService.removeSecureStorage("authToken");
          const deleteRefresh =
            this.toolService.removeSecureStorage("refreshToken");
          return from(Promise.all([deleteAccess, deleteRefresh]));
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
    let refreshToken = await this.toolService.getSecureStorage("refreshToken");
    //   getting role ---------------------------
    // this.toolService.getSecureStorage("refreshToken").subscribe({
    //   next: (result) => {
    //     refreshToken = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, refreshToken role en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

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
    this.toolService.setSecureStorage("authToken", token.authToken);

    this.toolService.setSecureStorage("tokenIAT", token.iatDate);
    this.toolService.setSecureStorage("tokenEXP", token.expDate);

    // get new refresh token-------------
    if (token.refreshToken !== "")
      this.toolService.setSecureStorage("refreshToken", token.refreshToken); //secure storage

    return from(this.currentAuthToken);
    // return from(this.storage.set(TOKEN_KEY, accessToken));
  }

  //---- GET data from server  ------
  getData_key(collection: String, data: any) {
    // secure storage --------------
    let token = this.toolService.getSecureStorage("authToken");

    //   getting authToken ---------------------------
    // this.toolService.getSecureStorage("authToken").subscribe({
    //   next: (result) => {
    //     token = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo authToken en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

    let options = {
      headers: {
        Accept: "application/json",
        "content-type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        authorization: `Bearer ${token}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT",
      },
    };

    return this.http.get(this.REST_API_SERVER + collection, options);
  }

  getData<T>(path: string): Observable<T> {
    // Convertir la Promise de getSecureStorage a un Observable
    console.log("El path en getData: ", path);
    return from(this.toolService.getSecureStorage("authToken")).pipe(
      // switchMap se suscribe al Observable de `from` y luego al nuevo Observable del `http.get`
      switchMap((token: any) => {
        let headers = new HttpHeaders();
        if (!this.toolService.isPublicEndpoint(path)) {
          console.log("EndPoint seguro");
          headers = headers.set("Authorization", `Bearer ${token}`);
        } else {
          console.log("EndPoint publico..");
        }

        return this.http.get<T>(`${this.REST_API_SERVER}${path}`, { headers });
      }),
      // Manejo de errores
      catchError((err) => {
        console.error("Error fetching data:", err);
        if (err.expired) {
          console.log("Esta chingadera expiro!");
        }
        return throwError(() => err);
      })
    );
  }

  // #region ---- new endpoint request ---------------------------------------

  getData_new<T>(path: string): Observable<T> {
    console.log("El path en getData: ", path);

    // isPublicEndpoint ahora devuelve una Promise, así que usamos from
    return from(this.toolService.isPublicEndpoint(path)).pipe(
      switchMap((isPublic: boolean) => {
        console.log(isPublic ? "EndPoint público" : "EndPoint seguro");

        if (isPublic) {
          // Endpoint público - no necesita token
          return this.handlePublicRequest<T>(path);
        } else {
          // Endpoint privado - necesita token
          return this.handlePrivateRequest<T>(path);
        }
      }),
      catchError((error: any) => {
        console.error("Error al determinar si el endpoint es público:", error);
        return throwError(() => error);
      })
    );
  }

  private handlePublicRequest<T>(path: string): Observable<T> {
    console.log(`URL --> ${this.REST_API_SERVER}${path}`);
    return this.http.get<T>(`${this.REST_API_SERVER}${path}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error("Error en endpoint público:", error);
        return this.handleError(error);
      })
    );
  }

  private handlePrivateRequest<T>(path: string): Observable<T> {
    return from(this.toolService.getSecureStorage("authToken")).pipe(
      switchMap((token: string | null) => {
        if (!token) {
          console.error("No hay token disponible para endpoint privado");
          return throwError(() => new Error("No autenticado"));
        }

        const headers = new HttpHeaders().set(
          "Authorization",
          `Bearer ${token}`
        );
        return this.http.get<T>(`${this.REST_API_SERVER}${path}`, { headers });
      }),
      catchError((error: HttpErrorResponse | Error) => {
        console.error("Error en endpoint privado:", error);

        if (error instanceof HttpErrorResponse && error.status === 401) {
          console.log("Token expirado!");
          this.handleTokenExpiration();
        }

        return this.handleError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    let errorMessage = "Ocurrió un error";

    if (error instanceof HttpErrorResponse) {
      errorMessage = `Error HTTP ${error.status}: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private handleTokenExpiration(): void {
    console.warn("Manejando expiración del token");
    // Implementa tu lógica aquí
  }
  // }

  // Interface actualizada para ToolService
  // interface ToolService {
  //   isPublicEndpoint(path: string): Promise<boolean>;  // Ahora devuelve Promise
  //   getSecureStorage<T>(key: string): Promise<T | null>;
  // }

  // #endregion ---- end new endpoint request ---------------------------------------

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
    let token = await this.toolService.getSecureStorage("authToken");

    //   getting authToken ---------------------------
    // this.toolService.getSecureStorage("authToken").subscribe({
    //   next: (result) => {
    //     token = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo authToken en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

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
    let token = await this.toolService.getSecureStorage("authToken");

    //   getting authToken ---------------------------
    // this.toolService.getSecureStorage("authToken").subscribe({
    //   next: (result) => {
    //     token = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo authToken en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

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
    let token = await this.toolService.getSecureStorage("authToken");

    //   getting authToken ---------------------------
    // this.toolService.getSecureStorage("authToken").subscribe({
    //   next: (result) => {
    //     token = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo authToken en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

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

    let token = await this.toolService.getSecureStorage("authToken");

    //   getting authToken ---------------------------
    // this.toolService.getSecureStorage("authToken").subscribe({
    //   next: (result) => {
    //     token = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo authToken en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

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
    let token = await this.toolService.getSecureStorage("authToken");

    //   getting authToken ---------------------------
    // this.toolService.getSecureStorage("authToken").subscribe({
    //   next: (result) => {
    //     token = result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo authToken en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

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
