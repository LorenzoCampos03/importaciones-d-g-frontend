import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/service/auth.service';
import { LoginRequest, LoginResponse } from '../../../core/interfaces/auth.interface';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private cdRef: ChangeDetectorRef
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.getDefaultRoute();
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      const currentUrl = this.router.url;
      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        const defaultRoute = this.getDefaultRoute();
        this.router.navigate([defaultRoute]);
      }
      return;
    }

    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.notificationService.success('¡Registro Exitoso! ' + message, 5000);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials: LoginRequest = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response: LoginResponse) => {
          this.isLoading = false;
          this.cdRef.detectChanges();

          if (response.success) {
            console.log('Login exitoso:', response);
            console.log('Rol del usuario:', response.role);

            const defaultRoute = this.getDefaultRoute(response.role);
            console.log('Redirigiendo a:', defaultRoute);
            this.router
              .navigate([defaultRoute])
              .then((success) => {
                console.log('Navegación exitosa:', success);

                setTimeout(() => {
                  this.notificationService.success(
                    `¡Bienvenido ${response.name || response.username}! Has iniciado sesión correctamente`,
                    4000
                  );
                }, 100);
              })
              .catch((error) => {
                console.error('Error en navegación:', error);
              });
          } else {
            this.notificationService.error(
              'Credenciales Inválidas: ' + (response.message || 'Usuario o contraseña incorrectos')
            );
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.cdRef.detectChanges();
          console.log('Error completo:', error);

          if (error.status === 401) {
            this.notificationService.error('Credenciales Inválidas: Usuario o contraseña incorrectos');
          } else if (error.status === 403) {
            this.notificationService.error('Acceso Denegado: Su cuenta no tiene permisos suficientes');
          } else if (error.status === 404) {
            this.notificationService.error('Usuario No Encontrado: El usuario ingresado no existe');
          } else if (error.status === 0) {
            this.notificationService.error(
              'Error de Conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.'
            );
          } else if (error.error && error.error.message) {
            this.notificationService.error('Error de Autenticación: ' + error.error.message);
          } else {
            this.notificationService.error('Error Inesperado: Ocurrió un error inesperado. Intente nuevamente.');
          }
        }
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private getDefaultRoute(role?: string): string {
    return '/dashboard';
  }
}
