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

// #region constants ----------------------------------
const helper = new JwtHelperService();
const TOKEN = "authToken";
const REFRESH_TOKEN = "refreshToken";
const TOKEN_EXP = "token-exp";
const TOKEN_IAT = "token-iat";

const USER_NAME = "name";
const USERID = "userId";
const USER_ROLES = "roles";
const MY_SIM = "sim";
const CORE_SIM = "coreSim";
const USER_ROLE = "role";
const CORE_ID = "coreId";
const CORE_NAME = "coreName";
const LOCATION = "location";
const TWILIO = "twilio";
const CODE_EXPIRY = "code_expiry";

const LOCKED = "locked";
const EMAIL_TO_VISITOR = "emailToVisitor";
const EMAIL_TO_CORE = "emailToCore";

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
  // public roles:any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toolService: ToolsService
  ) {
    localStorage.setItem(TWILIO, "false");
    this.loadToken();
  }

  async loadToken() {
    const token = localStorage.getItem(TOKEN);

    if (token) {
      this.currentAuthToken = token;
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false);
    }
  }

  login(credentials: { email: string; pwd: string }): Observable<any> {
    tokens: this.Tokens;
    return this.http
      .post(`${this.REST_API_SERVER}api/auth/signin`, credentials)
      .pipe(
        switchMap(async (tokens: any) => {
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

          // localStorage.setItem(TOKEN_PX, tokens.pwd);

          // ------------------------------

          this.MyRole(tokens.roles).then(async (val_role) => {
            localStorage.setItem("myRole", val_role);
          });

          localStorage.setItem("email", tokens.email);

          localStorage.setItem(USERID, tokens.userId);
          localStorage.setItem(USER_NAME, tokens.userName);
          localStorage.setItem(USER_ROLES, JSON.stringify(tokens.roles));
          localStorage.setItem(CORE_SIM, tokens.coreSim);
          localStorage.setItem(MY_SIM, tokens.sim);
          localStorage.setItem(CORE_ID, tokens.coreId);
          localStorage.setItem(CORE_NAME, tokens.coreName);
          localStorage.setItem(LOCATION, tokens.location);
          localStorage.setItem(TWILIO, "false");
          localStorage.setItem(CODE_EXPIRY, tokens.code_expiry);

          localStorage.setItem(TOKEN_IAT, tokens.iatDate);
          localStorage.setItem(TOKEN_EXP, tokens.expDate);
          localStorage.setItem(LOCKED, tokens.locked);
          localStorage.setItem(EMAIL_TO_VISITOR, "true");
          localStorage.setItem(EMAIL_TO_CORE, "true");
          localStorage.setItem("remote", tokens.remote);

          // const authToken = localStorage.setItem(TOKEN, tokens.authToken);
          // const refreshToken = localStorage.setItem(
          //   REFRESH_TOKEN,
          //   tokens.refreshToken
          // );
          //
          return from(Promise.all([authToken, refreshToken]));
        }),
        tap((_) => {
          this.isAuthenticated.next(true);
        })
      );
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
    // const refreshToken = from(localStorage.getItem(REFRESH_TOKEN_KEY));
    const refreshToken = from(localStorage.getItem(REFRESH_TOKEN) ?? "");

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
    // return from(throwError(localStorage.setItem(TOKEN,authToken)));
    throwError(() => {
      // secure storage ---------
      return this.toolService.setSecureStorage("authToken", authToken);
      // return localStorage.setItem(TOKEN, authToken);
    });
    // return from(Observable.throw(localStorage.setItem(TOKEN,authToken)));
    // return from(this.storage.set(TOKEN, authToken));
  }
}
