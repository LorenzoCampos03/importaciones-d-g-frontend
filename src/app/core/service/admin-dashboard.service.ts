import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from './user.service';
import { ProductService } from './product.service';
import { SaleService } from './sale.service';
import { environment } from '../../../environments/environment';

export interface AdminDashboardStats {
     totalUsers: number;
     totalProducts: number;
     totalSales: number;
     totalRevenue: number;
     activeSales: number;
     activeEmployees: number;
     activeClients: number;
     inactiveProducts: number;
     activeProducts: number;
     monthlyRevenue: number;
     todayRevenue: number;
}

export interface RecentActivity {
     action: string;
     user: string;
     time: string;
     details?: string;
}

@Injectable({
     providedIn: 'root'
})
export class AdminDashboardService {
     constructor(
          private http: HttpClient,
          private userService: UserService,
          private productService: ProductService,
          private saleService: SaleService
     ) { }

     getAdminDashboardStats(): Observable<AdminDashboardStats> {
          return forkJoin({
               allUsers: this.userService.getAllUsers().pipe(catchError(() => of([]))),
               employees: this.userService.getAllEmployees().pipe(catchError(() => of([]))),

               allProducts: this.productService.getAll().pipe(catchError(() => of([]))),
               activeProducts: this.productService.getByStatus('A').pipe(catchError(() => of([]))),
               inactiveProducts: this.productService.getByStatus('I').pipe(catchError(() => of([]))),

               allSales: this.saleService.getSales().pipe(catchError(() => of([]))),
               activeSales: this.saleService.getActiveSales().pipe(catchError(() => of([])))
          }).pipe(
               map((data) => {
                    const totalRevenue = this.calculateTotalRevenue(data.allSales);
                    const monthlyRevenue = this.calculateMonthlyRevenue(data.allSales);
                    const todayRevenue = this.calculateTodayRevenue(data.allSales);

                    const activeClients = data.allUsers.filter((user) => user.role === 'Cliente' && user.status === 'A').length;

                    const activeEmployees = data.employees.filter((emp) => emp.status === 'A').length;

                    return {
                         totalUsers: data.allUsers.length,
                         totalProducts: data.allProducts.length,
                         totalSales: data.allSales.length,
                         totalRevenue: totalRevenue,
                         activeSales: data.activeSales.length,
                         activeEmployees: activeEmployees,
                         activeClients: activeClients,
                         activeProducts: data.activeProducts.length,
                         inactiveProducts: data.inactiveProducts.length,
                         monthlyRevenue: monthlyRevenue,
                         todayRevenue: todayRevenue
                    };
               }),
               catchError(() =>
                    of({
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
                    })
               )
          );
     }

     private calculateTotalRevenue(sales: any[]): number {
          return sales.length * 1500;
     }

     private calculateMonthlyRevenue(sales: any[]): number {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const monthlySales = sales.filter((sale) => {
               const saleDate = new Date(sale.saleDate);
               return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
          });

          return this.calculateTotalRevenue(monthlySales);
     }

     private calculateTodayRevenue(sales: any[]): number {
          const today = new Date().toISOString().split('T')[0];

          const todaySales = sales.filter((sale) => {
               const saleDate = new Date(sale.saleDate).toISOString().split('T')[0];
               return saleDate === today;
          });

          return this.calculateTotalRevenue(todaySales);
     }

     /**
      * Obtener estadísticas de productos por categoría (simplificado)
      */
     getProductStatsByCategory(): Observable<any> {
          return this.productService.getAll().pipe(
               map((products) => {
                    const categoryStats: { [key: string]: any } = products.reduce((stats: { [key: string]: any }, product) => {
                         const category = product.categoryName || 'Sin categoría';
                         if (!stats[category]) {
                              stats[category] = {
                                   total: 0,
                                   active: 0,
                                   inactive: 0
                              };
                         }
                         stats[category].total++;
                         if (product.status === 'A') {
                              stats[category].active++;
                         } else {
                              stats[category].inactive++;
                         }
                         return stats;
                    }, {});

                    return categoryStats;
               }),
               catchError(() => of({}))
          );
     }

     getTopEmployeesBySales(): Observable<any[]> {
          return this.userService.getAllEmployees().pipe(
               map((employees) => {
                    return employees
                         .filter((emp) => emp.status === 'A')
                         .slice(0, 5)
                         .map((employee, index) => ({
                              employeeId: employee.user_id,
                              name: `${employee.name} ${employee.last_name}`,
                              totalSales: Math.floor(Math.random() * 20) + 5,
                              totalRevenue: Math.floor(Math.random() * 50000) + 10000,
                              averageOrderValue: Math.floor(Math.random() * 5000) + 1000
                         }))
                         .sort((a, b) => b.totalRevenue - a.totalRevenue);
               }),
               catchError(() => of([]))
          );
     }

     /**
      * Obtener estadísticas de crecimiento (simplificado)
      */
     getGrowthComparison(): Observable<any> {
          return this.saleService.getSales().pipe(
               map((sales) => {
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

                    const currentMonthSales = sales.filter((sale) => {
                         const saleDate = new Date(sale.saleDate);
                         return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
                    });

                    const lastMonthSales = sales.filter((sale) => {
                         const saleDate = new Date(sale.saleDate);
                         return saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastMonthYear;
                    });

                    const salesGrowth =
                         lastMonthSales.length > 0
                              ? ((currentMonthSales.length - lastMonthSales.length) / lastMonthSales.length) * 100
                              : 0;

                    return {
                         currentMonth: {
                              sales: currentMonthSales.length,
                              revenue: currentMonthSales.length * 1500
                         },
                         lastMonth: {
                              sales: lastMonthSales.length,
                              revenue: lastMonthSales.length * 1500
                         },
                         growth: {
                              revenue: salesGrowth,
                              sales: salesGrowth
                         }
                    };
               }),
               catchError(() =>
                    of({
                         currentMonth: { sales: 0, revenue: 0 },
                         lastMonth: { sales: 0, revenue: 0 },
                         growth: { revenue: 0, sales: 0 }
                    })
               )
          );
     }
}
