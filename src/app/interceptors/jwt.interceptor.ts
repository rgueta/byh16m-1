import { Injectable, inject } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError, from, BehaviorSubject } from "rxjs";
import { catchError, switchMap, filter, take, finalize } from "rxjs/operators";
import { AuthenticationService } from "../services/authentication.service";

@Injectable({ providedIn: "root" })
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthenticationService);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  token: any = null;
  constructor() {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // No interceptar peticiones de refresh para evitar ciclos
    if (req.url.includes("/api/auth/refresh")) {
      return next.handle(req);
    }

    return from(this.authService.getAccessToken()).pipe(
      switchMap((token) => {
        let authReq = req;
        if (token) {
          authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        return next.handle(authReq).pipe(
          catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              return this.handle401Error(authReq, next);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  private handle401Error(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.authService.refreshToken()).pipe(
        switchMap((success: boolean) => {
          if (success) {
            return from(this.authService.getAccessToken()).pipe(
              switchMap((newToken) => {
                this.refreshTokenSubject.next(newToken);

                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });

                return next.handle(newReq);
              })
            );
          } else {
            console.log(
              "⚠️ Refresh token falló, pero NO hacemos logout automático"
            );
            // NO hacemos logout - solo notificamos que no se pudo refrescar
            this.refreshTokenSubject.next(null);
            return throwError(() => new Error("No se pudo refrescar el token"));
          }
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Esperar mientras se refresca el token
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          const newReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next.handle(newReq);
        })
      );
    }
  }
}
