import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor — functional interceptor (Angular 15+ style).
 * Automatically injects the JWT Bearer token into every outgoing HTTP request.
 * Equivalent to an OkHttp Interceptor in the Java/Android world.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('tmc_token');

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }

  return next(req);
};
