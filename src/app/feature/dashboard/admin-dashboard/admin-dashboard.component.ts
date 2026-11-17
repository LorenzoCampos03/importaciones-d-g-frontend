import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/service/auth.service';
import {
     AdminDashboardService,
     AdminDashboardStats,
     RecentActivity
} from '../../../core/service/admin-dashboard.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
     selector: 'app-admin-dashboard',
     imports: [CommonModule],
     templateUrl: './admin-dashboard.component.html',
     styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
     currentUser: any = null;
     loading = true;
     error: string | null = null;

     adminStats: AdminDashboardStats = {
          totalUsers: 0,
          totalProducts: 0,
          totalSales: 0,
          totalRevenue: 0,
          activeSales: 0,
          activeEmployees: 0,
          activeClients: 0,
          activeProducts: 0,
          inactiveProducts: 0,
          monthlyRevenue: 0,
          todayRevenue: 0
     };

     recentActivity: RecentActivity[] = [];
     growthComparison: any = null;
     topEmployees: any[] = [];

     private subscriptions = new Subscription();

     constructor(
          private authService: AuthService,
          private router: Router,
          private adminDashboardService: AdminDashboardService
     ) { }

     ngOnInit() {
          this.currentUser = this.authService.getCurrentUser();
          this.loadAdminStats();
          this.setupAutoRefresh();
     }

     ngOnDestroy() {
          this.subscriptions.unsubscribe();
     }

     private loadAdminStats() {
          this.loading = true;
          this.error = null;

          const statsSubscription = this.adminDashboardService.getAdminDashboardStats().subscribe({
               next: (stats) => {
                    this.adminStats = stats;
                    this.loading = false;
               },
               error: (error) => {
                    console.error('Error al cargar estadísticas del dashboard:', error);
                    this.error = 'Error al cargar las estadísticas';
                    this.loading = false;
                    this.loadFallbackData();
               }
          });

          const growthSubscription = this.adminDashboardService.getGrowthComparison().subscribe({
               next: (growth) => {
                    this.growthComparison = growth;
               },
               error: (error) => {
                    console.error('Error al cargar comparación de crecimiento:', error);
               }
          });

          const employeesSubscription = this.adminDashboardService.getTopEmployeesBySales().subscribe({
               next: (employees) => {
                    this.topEmployees = employees;
               },
               error: (error) => {
                    console.error('Error al cargar top empleados:', error);
               }
          });

          this.subscriptions.add(statsSubscription);
          this.subscriptions.add(growthSubscription);
          this.subscriptions.add(employeesSubscription);
     }

     private loadFallbackData() {
          this.adminStats = {
               totalUsers: 150,
               totalProducts: 320,
               totalSales: 89,
               totalRevenue: 45680,
               activeSales: 65,
               activeEmployees: 8,
               activeClients: 142,
               activeProducts: 298,
               inactiveProducts: 22,
               monthlyRevenue: 35420,
               todayRevenue: 2340
          };
     }

     private setupAutoRefresh() {
          const refreshSubscription = interval(30000)
               .pipe(switchMap(() => this.adminDashboardService.getAdminDashboardStats()))
               .subscribe({
                    next: (stats) => {
                         this.adminStats = stats;
                    },
                    error: (error) => {
                         console.error('Error en actualización automática:', error);
                    }
               });

          this.subscriptions.add(refreshSubscription);
     }

     refreshDashboard() {
          this.loadAdminStats();
     }

     navigateTo(route: string) {
          this.router.navigate([route]);
     }

     exportReport() {
          console.log('Exportando reporte...');
     }

     formatCurrency(amount: number): string {
          return new Intl.NumberFormat('es-PE', {
               style: 'currency',
               currency: 'PEN'
          }).format(amount);
     }

     formatNumber(number: number): string {
          return new Intl.NumberFormat('es-PE').format(number);
     }

     getGrowthClass(growth: number): string {
          if (growth > 0) return 'text-green-600';
          if (growth < 0) return 'text-red-600';
          return 'text-gray-600';
     }

     getGrowthIcon(growth: number): string {
          if (growth > 0) return 'fas fa-arrow-up';
          if (growth < 0) return 'fas fa-arrow-down';
          return 'fas fa-minus';
     }

     getCurrentDate(): string {
          return new Date().toLocaleDateString('es-PE', {
               year: 'numeric',
               month: 'long',
               day: 'numeric'
          });
     }
}
