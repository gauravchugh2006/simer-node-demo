import 'zone.js';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/services/auth.interceptor';
import { loggingInterceptor } from './app/services/logging.interceptor';

console.info('[Bootstrap] Starting Cafe Coffee Day Angular application');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))
  ]
})
  .then(() => console.info('[Bootstrap] Angular app bootstrapped successfully'))
  .catch((err) => console.error('[Bootstrap] Failed to bootstrap application', err));
