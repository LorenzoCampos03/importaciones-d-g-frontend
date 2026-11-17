import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/service/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { AuthUser } from '../../../core/interfaces/auth.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  currentUser: AuthUser | null = null;
  isCollapsed$: Observable<boolean>;
  isMobileOpen$: Observable<boolean>;

  constructor(
    private authService: AuthService,
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

  toggleSidebar(): void {
    this.sidebarService.toggleCollapse();
  }

  toggleMobileMenu(): void {
    this.sidebarService.toggleMobileMenu();
  }
}
