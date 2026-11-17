import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/service/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { AuthUser } from '../../../core/interfaces/auth.interface';
import { Observable } from 'rxjs';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  currentUser: AuthUser | null = null;
  isCollapsed$: Observable<boolean>;
  isMobileOpen$: Observable<boolean>;

  adminLinks: NavLink[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { path: '/admin/products', label: 'Productos', icon: 'fas fa-box' },
    { path: '/admin/clients', label: 'Clientes', icon: 'fas fa-users' },
    { path: '/admin/locations', label: 'Sedes', icon: 'fas fa-building' },
    { path: '/admin/employees', label: 'Empleados', icon: 'fas fa-id-badge' },
    { path: '/admin/sales', label: 'Ventas', icon: 'fas fa-shopping-cart' },
    { path: '/admin/purchases', label: 'Compras', icon: 'fas fa-truck' }
  ];
  sellerLinks: NavLink[] = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { path: '/seller/products', label: 'Productos', icon: 'fas fa-box' },
    { path: '/seller/sales', label: 'Mis Ventas', icon: 'fas fa-shopping-cart' },
    {path: '/seller/purchases', label: 'Compras', icon: 'fas fa-receipt' }
  ];

  clientLinks: NavLink[] = [
    { path: '/client/dashboard', label: 'Mi Información', icon: 'fas fa-user' },
    { path: '/client/purchases', label: 'Mis Compras', icon: 'fas fa-receipt' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService
  ) {
    this.isCollapsed$ = this.sidebarService.isCollapsed$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  getIcon(iconName: string): string {
    return iconName || 'fas fa-home';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  closeMobileMenu(): void {
    this.sidebarService.closeMobileMenu();
  }

  onLinkClick(): void {
    if (window.innerWidth < 768) {
      this.closeMobileMenu();
    }
  }
}
