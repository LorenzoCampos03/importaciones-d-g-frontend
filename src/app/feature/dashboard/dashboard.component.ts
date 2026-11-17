import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/service/auth.service';
import { Router } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ClientDashboardComponent } from './client-dashboard/client-dashboard.component';
import { SellerDashboardComponent } from './seller-dashboard/seller-dashboard.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, AdminDashboardComponent, ClientDashboardComponent, SellerDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  userRole: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.userRole = this.currentUser?.role || '';

    if (!this.currentUser || !this.userRole) {
      this.router.navigate(['/login']);
      return;
    }
  }
}
