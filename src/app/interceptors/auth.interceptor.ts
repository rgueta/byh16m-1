// import { HttpInterceptorFn } from '@angular/common/http';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req);
// };

import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError, BehaviorSubject, of } from "rxjs";
import { catchError, filter, take, switchMap } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Obtener el access token
    const accessToken = this.authService.getAuthToken();
    const refreshToken = this.authService.getRefreshToken();

    console.log("My auth token:  ", accessToken);
    console.log("My refresh token:  ", refreshToken);

    // Si existe el token, clonar la solicitud y agregar el encabezado Authorization
    if (accessToken) {
      request = this.addToken(request, accessToken);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si el error es 401 (Unauthorized) y la URL no es la de refresh (para evitar bucles)
        if (error.status === 401 && !request.url.includes("/refresh")) {
          console.log("valio mauser.. ya caduco el token !");
          return this.handle401Error(request, next);
        } else {
          return throwError(error);
        }
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.useRefreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);
          // Repetir la solicitud original con el nuevo token
          return next.handle(this.addToken(request, response.accessToken));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          // Si falla el refresh token, desloguear al usuario
          this.authService.logout();
          return throwError(error);
        })
      );
    } else {
      // Si ya se está refrescando el token, esperar a que termine y luego repetir la solicitud
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}
