import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './core/service/auth.service';
import { NotificationService } from './shared/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="p-4">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  private onlineListener?: () => void;
  private offlineListener?: () => void;

  ngOnInit() {
    this.setupConnectivityListeners();
  }

  ngOnDestroy() {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
    }
  }

  private setupConnectivityListeners() {
    this.offlineListener = () => {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.authService.logout();
        this.router.navigate(['/login']).then(() => {
          this.notificationService.error('Se perdió la conexión a internet. Tu sesión ha sido cerrada.', 5000);
        });
      }
    };

    this.onlineListener = () => {
      // Solo mostrar mensaje si no está en login
      if (!this.router.url.includes('/login')) {
        this.notificationService.success('Conexión restaurada', 3000);
      }
    };

    window.addEventListener('offline', this.offlineListener);
    window.addEventListener('online', this.onlineListener);
  }
}
