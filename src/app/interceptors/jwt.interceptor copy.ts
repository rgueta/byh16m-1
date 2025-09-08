import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getAuthToken();
  const refreshToken = authService.getRefreshToken();
  console.log("My auth token:  ", authToken);
  console.log("My refresh token:  ", refreshToken);
  return next(req);
};
