// import { HttpInterceptorFn } from '@angular/common/http';

// export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req);
// };


import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from, BehaviorSubject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);


  constructor(private authService: AuthenticationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // No interceptar requests de auth
    console.log('si entre al interceptor..!!!');
    if (req.url.includes('api/auth/signin') || 
        req.url.includes('api/auth/signup') || 
        req.url.includes('api/auth/pwdResetReq') ||
        req.url.includes('api/auth/register/')) {
      return next.handle(req);
    }

    return from(this.addTokenToRequest(req)).pipe(
      switchMap(authReq => next.handle(authReq)),
      catchError((error: HttpErrorResponse) => {
        // if (error.status === 401 && error.error?.code === 'TOKEN_EXPIRED') {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(error);
      })
    );
  }

  private async addTokenToRequest(req: HttpRequest<any>): Promise<HttpRequest<any>> {
    const token = await this.authService.getAccessToken();
    
    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return req;
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('si entre al 401 handler..!!!');
    return from(this.authService.refreshToken()).pipe(
      switchMap(success => {
        if (success) {
          return from(this.addTokenToRequest(req)).pipe(
            switchMap(newReq => next.handle(newReq))
          );
        } else {
          this.authService.logout();
          return throwError('Authentication failed');
        }
      }),
      catchError(error => {
        this.authService.logout();
        return throwError(error);
      })
    );
  }
}