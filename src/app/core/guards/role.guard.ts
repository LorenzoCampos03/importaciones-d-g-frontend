import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    console.log('RoleGuard - Expected roles:', expectedRoles);

    if (!this.authService.isAuthenticated()) {
      console.log('RoleGuard - User not authenticated');
      this.router.navigate(['/login']);
      return false;
    }

    const currentUser = this.authService.getCurrentUser();
    console.log('RoleGuard - Current user:', currentUser);

    if (expectedRoles && expectedRoles.length > 0) {
      const hasRole = this.authService.hasAnyRole(expectedRoles);
      console.log('RoleGuard - User has required role:', hasRole);

      if (hasRole) {
        return true;
      } else {
        console.log('RoleGuard - Access denied, redirecting to login');
        this.router.navigate(['/login']);
        return false;
      }
    }

    return true;
  }
}
