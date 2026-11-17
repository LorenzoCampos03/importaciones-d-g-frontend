import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, combineLatest } from 'rxjs';
import { ClientStats, ClientDashboardData, RecentPurchase } from '../interfaces/client-stats.interface';
import { Sale } from '../interfaces/sale.interface';
import { AuthUser } from '../interfaces/auth.interface';
import { environment } from '../../../environments/environment';
import { SaleService } from './sale.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClientDashboardService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private saleService: SaleService,
    private authService: AuthService
  ) { }

  getClientDashboardData(): Observable<ClientDashboardData> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    return combineLatest([this.getUserInfo(currentUser.userId), this.getClientStats(currentUser.userId)]).pipe(
      map(([userInfo, stats]) => ({
        userInfo,
        stats
      }))
    );
  }

  private getUserInfo(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`).pipe(
      map((user) => ({
        name: user.name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        memberSince: user.createdAt || user.created_at || new Date().toISOString()
      }))
    );
  }

  getClientStats(clientId: number): Observable<ClientStats> {
    return this.saleService.getSalesByClient(clientId).pipe(map((sales) => this.calculateStats(sales)));
  }

  private calculateStats(sales: Sale[]): ClientStats {
    const totalPurchases = sales.length;
    const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0);
    const pendingOrders = sales.filter(
      (sale) => sale.status.toLowerCase() === 'pendiente' || sale.status.toLowerCase() === 'en proceso'
    ).length;
    const completedOrders = sales.filter(
      (sale) => sale.status.toLowerCase() === 'completado' || sale.status.toLowerCase() === 'entregado'
    ).length;
    const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

    const sortedSales = sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    const lastPurchaseDate = sortedSales.length > 0 ? sortedSales[0].saleDate : null;

    const recentPurchases: RecentPurchase[] = sortedSales.slice(0, 5).map((sale) => ({
      saleId: sale.saleId,
      saleDate: sale.saleDate,
      total: sale.total,
      status: sale.status,
      itemCount: sale.saleDetails.reduce((sum, detail) => sum + detail.quantity, 0)
    }));

    return {
      totalPurchases,
      totalSpent,
      pendingOrders,
      completedOrders,
      averageOrderValue,
      lastPurchaseDate,
      recentPurchases
    };
  }
}
