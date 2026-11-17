import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface SellerStats {
  mySales: number;
  pendingSales: number;
  todayRevenue: number;
  clientsServed: number;
  monthlyTarget: number;
  completedSales: number;
  dailyTarget: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
}

export interface SaleRecord {
  id: string;
  client: string;
  product: string;
  amount: number;
  status: 'Completada' | 'Pendiente' | 'Procesando' | 'Cancelado';
  date: string;
  time: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
  category?: string;
  stock?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SellerDashboardService {
  private sellerStatsSubject = new BehaviorSubject<SellerStats>({
    mySales: 25,
    pendingSales: 5,
    todayRevenue: 3250.75,
    clientsServed: 18,
    monthlyTarget: 15000,
    completedSales: 20,
    dailyTarget: 500,
    weeklyRevenue: 12500.5,
    monthlyRevenue: 45000.0
  });

  private recentSalesSubject = new BehaviorSubject<SaleRecord[]>([
    {
      id: '#SALE-001',
      client: 'Ana María López',
      product: 'MacBook Pro 16"',
      amount: 2499.99,
      status: 'Completada',
      date: '2025-01-13',
      time: '14:30',
      priority: 'high'
    },
    {
      id: '#SALE-002',
      client: 'Carlos Mendoza',
      product: 'iPhone 15 Pro Max',
      amount: 1199.99,
      status: 'Pendiente',
      date: '2025-01-13',
      time: '12:15',
      priority: 'medium'
    },
    {
      id: '#SALE-003',
      client: 'Lucía Herrera',
      product: 'iPad Air 5ta Gen',
      amount: 599.99,
      status: 'Procesando',
      date: '2025-01-12',
      time: '16:45',
      priority: 'low'
    },
    {
      id: '#SALE-004',
      client: 'Roberto Silva',
      product: 'Samsung Galaxy S24',
      amount: 899.99,
      status: 'Completada',
      date: '2025-01-12',
      time: '11:20',
      priority: 'medium'
    },
    {
      id: '#SALE-005',
      client: 'María Fernández',
      product: 'AirPods Pro 2',
      amount: 249.99,
      status: 'Pendiente',
      date: '2025-01-11',
      time: '09:15',
      priority: 'high'
    }
  ]);

  private topProductsSubject = new BehaviorSubject<TopProduct[]>([
    {
      name: 'MacBook Pro 16"',
      sales: 15,
      revenue: 37499.85,
      trend: 'up',
      category: 'Laptops',
      stock: 8
    },
    {
      name: 'iPhone 15 Pro',
      sales: 12,
      revenue: 14399.88,
      trend: 'up',
      category: 'Smartphones',
      stock: 25
    },
    {
      name: 'Samsung Galaxy S24',
      sales: 8,
      revenue: 7199.92,
      trend: 'down',
      category: 'Smartphones',
      stock: 12
    },
    {
      name: 'iPad Air 5ta Gen',
      sales: 6,
      revenue: 3599.94,
      trend: 'up',
      category: 'Tablets',
      stock: 15
    }
  ]);

  constructor() { }

  getSellerStats(): Observable<SellerStats> {
    return this.sellerStatsSubject.asObservable();
  }

  getRecentSales(): Observable<SaleRecord[]> {
    return this.recentSalesSubject.asObservable();
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.topProductsSubject.asObservable();
  }

  getPendingSales(): Observable<SaleRecord[]> {
    return this.recentSalesSubject.pipe(map((sales) => sales.filter((sale) => sale.status === 'Pendiente')));
  }

  getHighPrioritySales(): Observable<SaleRecord[]> {
    return this.recentSalesSubject.pipe(map((sales) => sales.filter((sale) => sale.priority === 'high')));
  }

  refreshStats(): Observable<SellerStats> {
    return of(this.generateRandomStats()).pipe(
      delay(1000)
    );
  }

  updateSaleStatus(saleId: string, newStatus: SaleRecord['status']): Observable<boolean> {
    const currentSales = this.recentSalesSubject.value;
    const updatedSales = currentSales.map((sale) => (sale.id === saleId ? { ...sale, status: newStatus } : sale));

    this.recentSalesSubject.next(updatedSales);
    return of(true).pipe(delay(500));
  }

  getDailyProgress(dailyTarget: number, todayRevenue: number): number {
    return Math.min((todayRevenue / dailyTarget) * 100, 100);
  }

  getWeeklyProgress(weeklyTarget: number, weeklyRevenue: number): number {
    return Math.min((weeklyRevenue / weeklyTarget) * 100, 100);
  }

  getMonthlyProgress(monthlyTarget: number, monthlyRevenue: number): number {
    return Math.min((monthlyRevenue / monthlyTarget) * 100, 100);
  }

  getRemainingToTarget(target: number, current: number): number {
    return Math.max(target - current, 0);
  }

  getGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  getSalesPerformanceGrade(dailyProgress: number): string {
    if (dailyProgress >= 100) return 'Excelente';
    if (dailyProgress >= 80) return 'Muy Bueno';
    if (dailyProgress >= 60) return 'Bueno';
    if (dailyProgress >= 40) return 'Regular';
    return 'Necesita Mejorar';
  }

  getImportantNotifications(): Observable<string[]> {
    const notifications: string[] = [];
    const stats = this.sellerStatsSubject.value;
    const currentHour = new Date().getHours();

    if (stats.pendingSales > 0) {
      notifications.push(`Tienes ${stats.pendingSales} ventas pendientes que requieren atención.`);
    }

    const dailyProgress = this.getDailyProgress(stats.dailyTarget, stats.todayRevenue);
    if (dailyProgress < 50 && currentHour > 14) {
      notifications.push('Estás por debajo del 50% de tu meta diaria. ¡Es hora de acelerar!');
    }

    if (currentHour > 16 && dailyProgress < 30) {
      notifications.push('Quedan pocas horas del día. Considera contactar clientes potenciales.');
    }

    return of(notifications);
  }

  private generateRandomStats(): SellerStats {
    const baseStats = this.sellerStatsSubject.value;
    return {
      ...baseStats,
      todayRevenue: baseStats.todayRevenue + (Math.random() * 500 - 250),
      mySales: baseStats.mySales + Math.floor(Math.random() * 3),
      pendingSales: Math.max(0, baseStats.pendingSales + Math.floor(Math.random() * 3 - 1))
    };
  }

  simulateRealTimeUpdates(): Observable<SellerStats> {
    return new Observable((observer) => {
      const interval = setInterval(() => {
        const newStats = this.generateRandomStats();
        this.sellerStatsSubject.next(newStats);
        observer.next(newStats);
      }, 30000);

      return () => clearInterval(interval);
    });
  }
}
