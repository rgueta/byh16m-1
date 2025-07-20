import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { BehaviorSubject, from, of, Observable, throwError } from "rxjs";
import { tap, switchMap } from "rxjs/operators";
import {
  HttpClient,
  HttpHandler,
  HttpHeaders,
  HttpParams,
} from "@angular/common/http";
import { Router } from "@angular/router";
import { Utils } from "../tools/tools";
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
    const token = this.toolService.getSecureStorage("authToken");
    // const token = localStorage.getItem(TOKEN);
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
          const deleteAccess = localStorage.removeItem(TOKEN);
          const deleteRefresh = localStorage.removeItem(REFRESH_TOKEN);
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
  getNewAccessToken() {
    // const refreshToken = from<string>(localStorage.getItem(REFRESH_TOKEN_KEY));
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (localStorage.getItem(REFRESH_TOKEN)) {
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

    localStorage.setItem(TOKEN_IAT, token.iatDate);
    localStorage.setItem(TOKEN_EXP, token.expDate);

    // get new refresh token-------------
    if (token.refreshToken !== "")
      this.toolService.setSecureStorage("refreshToken", token.refreshToken); //secure storage
    // localStorage.setItem(REFRESH_TOKEN, token.refreshToken);

    return from(this.currentAuthToken);
    // return from(this.storage.set(TOKEN_KEY, accessToken));
  }

  //---- GET data from server  ------
  getData_key(collection: String, data: any) {
    // secure storage --------------
    const token = this.toolService.getSecureStorage("authToken");

    // const token = localStorage.getItem(TOKEN);

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
    return this.toolService.getSecureStorage("authToken").pipe(
      switchMap((token) => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set("Authorization", `Bearer ${token}`);
        }

        return this.http.get<T>(`${this.REST_API_SERVER}${path}`, { headers });
      })
    );
  }

  //--- POST data to server

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
    const token = this.toolService.getSecureStorage("authToken");
    // const token = localStorage.getItem(TOKEN);

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
    const token = this.toolService.getSecureStorage("authToken");
    // const token = localStorage.getItem(TOKEN);

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
    const token = this.toolService.getSecureStorage("authToken");
    // const token = localStorage.getItem(TOKEN);

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
    const token = this.toolService.getSecureStorage("authToken");
    // const token = localStorage.getItem(TOKEN);

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
    const token = this.toolService.getSecureStorage("authToken");
    // const token = localStorage.getItem(TOKEN);

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
