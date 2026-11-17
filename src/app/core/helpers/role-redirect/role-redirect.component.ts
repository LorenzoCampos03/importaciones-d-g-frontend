import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-role-redirect',
  standalone: true,
  template: ''
})
export class RoleRedirectComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    let path;
    switch (user?.role) {
      case 'Administrador':
        path = '/admin';
        break;
      case 'Vendedor':
        path = '/seller';
        break;
      case 'Cliente':
        path = '/client';
        break;
      default:
        this.authService.logout();
        path = '/login';
        break;
    }
    this.router.navigate([path]).catch((err) => {
      console.error('Redirection failed:', err);
      this.authService.logout();
      this.router.navigate(['/login']);
    });
  }
}
