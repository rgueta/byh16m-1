import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient,withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SMS, SmsOptions } from '@ionic-native/sms/ngx';
import { ScreenOrientation } from "@ionic-native/screen-orientation/ngx"
import { Sim } from "@ionic-native/sim/ngx";
import { AuthInterceptor } from "./app/interceptors/jwt.interceptor";

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    // Provee las funcionalidades de HTTP con soporte para interceptores
    provideHttpClient(withInterceptorsFromDi()),
    // Provee el servicio del interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    SMS,ScreenOrientation,Sim
  ],
  
});
