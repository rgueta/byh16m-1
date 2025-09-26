import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { take, map, tap, switchMap, subscribeOn } from "rxjs/operators";
import {
  BehaviorSubject,
  from,
  Observable,
  of,
  Subject,
  throwError,
} from "rxjs";
import { environment } from "../../environments/environment";
import { Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { tokens } from "../tools/data.model";
import { ToolsService } from "../services/tools.service";

// #region constants and interfaces  -------------------

export interface User {
  id: number;
  email: string;
  name: string;
}
const helper = new JwtHelperService();

export interface TokenResponse {
  success: boolean;
  data: {
    accessToken: string;
  }
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    }
  }
}

// #endregion

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  public user!: Observable<any>;
  private userData = new BehaviorSubject(null);
  Tokens!: tokens;

  // Init with null to filter out the first value in a guard!
  private REST_API_SERVER = environment.cloud.server_url;
  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  currentAuthToken: any;
  userId = "";
  private isRefreshing = false;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private toolService: ToolsService
  ) {
    toolService.setSecureStorage("twilio", "false");
    this.loadToken();
  }

  async loadToken() {
    const token = this.toolService.getSecureStorage("authToken");

    if (token) {
      this.currentAuthToken = token;
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false);
    }
  }

  login(credentials: { email: string; pwd: string }): Observable<AuthResponse> {
    tokens: this.Tokens;
    return this.http
      .post<AuthResponse>(`${this.REST_API_SERVER}api/auth/signin`, credentials)
      .pipe(
        tap(async (tokens: any) => {
          this.currentAuthToken = await tokens.authToken;

          // --------   secure storege  -------------
          let authToken: string | null = null;
          let refreshToken: string | null = null;

          await this.toolService
            .setSecureStorage("authToken", tokens.authToken)
            .then((value) => {
              authToken = value;
            })
            .catch((err) => {
              console.log("Error in authentication.service.ts --> ", err);
            });

          await this.toolService
            .setSecureStorage("refreshToken", tokens.refreshToken)
            .then((value) => {
              refreshToken = value;
            })
            .catch((err) => {
              console.log("Error in authentication.service.ts --> ", err);
            });

          await this.toolService
            .setSecureStorage("token_px", tokens.pwd)
            .then((value) => {})
            .catch((err) => {
              console.log("Error in authentication.service.ts --> ", err);
            });

          // ------------------------------

          this.MyRole(tokens.roles).then(async (val_role) => {
            this.toolService.setSecureStorage("myRole", val_role);
          });

          this.toolService.setSecureStorage("email", tokens.email);

          this.toolService.setSecureStorage("userId", tokens.userId);
          this.toolService.setSecureStorage("name", tokens.userName);
          // this.toolService.setSecureStorage(
          //   "roles",
          //   JSON.stringify(tokens.roles)
          // );

          this.toolService.setSecureStorage("roles",tokens.roles);

          this.toolService.setSecureStorage("remote", tokens.remote);
          this.toolService.setSecureStorage("coreSim", tokens.coreSim);
          this.toolService.setSecureStorage("sim", tokens.sim);
          this.toolService.setSecureStorage("coreId", tokens.coreId);
          this.toolService.setSecureStorage("coreName", tokens.coreName);
          this.toolService.setSecureStorage("location", tokens.location);
          this.toolService.setSecureStorage("twilio", false);
          this.toolService.setSecureStorage("codeExpiry", tokens.code_expiry);

          this.toolService.setSecureStorage("tokenIAT", tokens.iatDate);
          this.toolService.setSecureStorage("tokenEXP", tokens.expDate);
          this.toolService.setSecureStorage("locked", tokens.locked);
          this.toolService.setSecureStorage("emailToVisitor", true);
          this.toolService.setSecureStorage("emailToCore", true);
          
          return from(Promise.all([authToken, refreshToken]));
        }),
        tap((_) => {
          this.isAuthenticated.next(true);
        })
      );
  }


    // Refresh token
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.http.post<any>(
        `${this.REST_API_SERVER}api/auth/refresh`,
        { refreshToken }
      ).toPromise();

      console.log('response for Refresh: ', response);

      if (response?.success) {
        await this.toolService.setSecureStorage('authToken',response.authToken);
        return true;
      }
      return false;
    } catch (error) {
        console.error('Token refresh failed:', error);
      await this.logout();
      return false;
    }
  }


    // Obtener access token
  async getAccessToken(): Promise<string | null> {
    const result = await this.toolService.getSecureStorage('authToken');
    return result;
  }

    // Obtener refresh token
  async getRefreshToken(): Promise<string | null> {
    const result = await this.toolService.getSecureStorage('refreshToken');
    return result;
  }

    // Logout
  async logout(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (refreshToken) {
        await this.http.post(`${this.REST_API_SERVER}/logout`, { refreshToken }).toPromise();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar storage siempre
      await this.toolService.removeSecureStorage('authToken');
      await this.toolService.removeSecureStorage('refreshToken');
      await this.toolService.removeSecureStorage('user');
      this.currentUserSubject.next(null);
    }
  }

  async MyRole(roles: any[]) {
    //--- check for admin role
    let myrole = "";
    if (
      await roles.find(
        (role: { name: string }) => role.name.toLowerCase() === "admin"
      )
    ) {
      myrole = "admin";
    } else if (
      await roles.find(
        (role: { name: string }) => role.name.toLowerCase() === "supervisor"
      )
    ) {
      myrole = "supervisor";
    } else if (
      await roles.find(
        (role: { name: string }) => role.name.toLowerCase() === "neighboradmin"
      )
    ) {
      myrole = "neighborAdmin";
    } else if (
      await roles.find(
        (role: { name: string }) => role.name.toLowerCase() === "neighbor"
      )
    ) {
      myrole = "neighbor";
    } else if (
      await roles.find(
        (role: { name: string }) => role.name.toLowerCase() === "relative"
      )
    ) {
      myrole = "relative";
    } else if (
      await roles.find(
        (role: { name: string }) => role.name.toLowerCase() === "visitor"
      )
    ) {
      myrole = "visitor";
    }

    return myrole;
  }

  getUser() {
    return this.userData.getValue();
  }

  // Load the refresh token from storage
  // then attach it as the header for one specific API call
  getNewAccessToken() {
    // commented for migration removed from
    const refreshToken = from(
      this.toolService.getSecureStorage("refreshToken") ?? ""
    );

    return refreshToken.pipe(
      switchMap((token) => {
        if (token) {
          const httpOptions = {
            headers: new HttpHeaders({
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            }),
          };
          return this.http.get(
            `${this.REST_API_SERVER}/api/auth/refresh`,
            httpOptions
          );
        } else {
          // No stored refresh token
          return of(null);
        }
      })
    );
  }

  // Store a new access token
  storeAccessToken(authToken: any) {
    this.currentAuthToken = authToken;
    throwError(() => {
      // secure storage ---------
      return this.toolService.setSecureStorage("authToken", authToken);
    });
    // return from(this.storage.set(TOKEN, authToken));
  }
}
