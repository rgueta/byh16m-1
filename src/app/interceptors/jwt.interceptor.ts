import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { catchError, switchMap, throwError } from "rxjs";
import { ToolsService } from "../services/tools.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toolService = inject(ToolsService);

  // Skip interception for refresh token requests to avoid infinite loops
  if (req.url.includes("refresh")) {
    return next(req);
  }

  const authToken = authService.getAuthToken();
  const refreshToken = authService.getRefreshToken();

  console.log("My auth token:  ", authToken);
  console.log("My refresh token:  ", refreshToken);

  // Add authorization header if token exists
  let authReq = req;
  if (authToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`, // Fixed typo and added Bearer prefix
      },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Only handle 401 errors and skip if no refresh token exists
      if (error.status !== 401 || !refreshToken) {
        console.log("valio mauser.. ya caduco el ");
        return throwError(() => error);
      }

      return authService.applyRefreshToken().pipe(
        switchMap((res: any) => {
          // Store new token securely
          toolService.setSecureStorage("authToken", res.authToken);

          // Retry original request with new token
          const newReq = authReq.clone({
            setHeaders: {
              Authorization: `Bearer ${res.authToken}`,
            },
          });
          return next(newReq);
        }),
        catchError((refreshError) => {
          // Clear storage on refresh failure
          authService.logout(); // Use service method for cleanup
          return throwError(() => refreshError);
        })
      );

      console.log("Todo OK !");
    })
  );
};
