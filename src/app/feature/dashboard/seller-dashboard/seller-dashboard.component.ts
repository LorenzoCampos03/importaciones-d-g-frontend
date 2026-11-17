import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/service/auth.service';
import { ProductService } from '../../../core/service/product.service';
import { SaleService } from '../../../core/service/sale.service';
import { SellerDashboardData } from '../../../core/interfaces/sale.interface';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-seller-dashboard',
  imports: [CommonModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.css'
})
export class SellerDashboardComponent implements OnInit {
  currentUser: any = null;

  isLoading = true;
  hasError = false;

  dashboardData: SellerDashboardData = {
    totalProducts: 0,
    totalSales: 0,
    todayRevenue: 0,
    pendingSales: 0,
    completedSales: 0,
    clientsServed: 0,
    monthlyTarget: 15000,
    dailyTarget: 500
  };
  constructor(
    private authService: AuthService,
    private router: Router,
    private productService: ProductService,
    private saleService: SaleService
  ) { }
  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }
  private loadDashboardData() {
    this.isLoading = true;
    this.hasError = false;

    const currentEmployeeId = this.currentUser?.userId;

    if (!currentEmployeeId) {
      console.error('No se encontró el userId del empleado');
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    forkJoin({
      products: this.productService.getAll(),
      sales: this.saleService.getSales()
    }).subscribe({
      next: (data) => {
        const employeeSales = data.sales.filter((sale) => sale.employeeId === currentEmployeeId);

        const today = new Date().toISOString().split('T')[0];
        const todaySales = employeeSales.filter((sale) => sale.saleDate.startsWith(today));
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

        const paidSales = employeeSales.filter((sale) => sale.status === 'Pagado').length;
        const pendingSales = employeeSales.filter((sale) => sale.status === 'Pendiente').length;

        const uniqueClients = new Set(employeeSales.map((sale) => sale.clientId));

        this.dashboardData = {
          totalProducts: data.products.length,
          totalSales: employeeSales.length,
          todayRevenue: todayRevenue,
          pendingSales: pendingSales,
          completedSales: paidSales,
          clientsServed: uniqueClients.size,
          monthlyTarget: 15000,
          dailyTarget: 500
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando datos del dashboard:', error);
        this.hasError = true;
        this.isLoading = false;

        this.dashboardData = {
          totalProducts: 0,
          totalSales: 0,
          todayRevenue: 0,
          pendingSales: 0,
          completedSales: 0,
          clientsServed: 0,
          monthlyTarget: 15000,
          dailyTarget: 500
        };
      }
    });
  }
  navigateToProducts() {
    this.router.navigate(['/seller/products']);
  }

  navigateToSales() {
    this.router.navigate(['/seller/sales']);
  }

  navigateToPurchases() {
    this.router.navigate(['/seller/purchases']);
  }

  createNewSale() {
    this.router.navigate(['/seller/sales/new']);
  }
  refreshDashboard() {
    this.loadDashboardData();
    console.log('Dashboard actualizado');
  }

  getCurrentDate(): string {
    return 'domingo, 23 de junio de 2025';
  }

  getDailyProgress(): number {
    const progress = (this.dashboardData.todayRevenue / this.dashboardData.dailyTarget) * 100;
    return Math.min(progress, 100);
  }

  getRemainingToTarget(): string {
    const remaining = this.dashboardData.dailyTarget - this.dashboardData.todayRevenue;
    return remaining > 0 ? remaining.toFixed(2) : '0.00';
  }
}
