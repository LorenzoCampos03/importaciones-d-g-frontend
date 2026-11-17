import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/service/auth.service';
import { ClientDashboardService } from '../../../core/service/client-dashboard.service';
import { SaleService } from '../../../core/service/sale.service';
import { UserService } from '../../../core/service/user.service';
import { ClientDashboardData, RecentPurchase } from '../../../core/interfaces/client-stats.interface';
import { Sale } from '../../../core/interfaces/sale.interface';
import { User } from '../../../core/interfaces/user';

@Component({
  selector: 'app-client-dashboard',
  imports: [CommonModule],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit {
  Math = Math;
  currentUser: any = null;
  userDetails: User | null = null;
  loading = true;
  error: string | null = null;
  clientStats = {
    myOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    deliveredOrders: 0
  };

  recentOrders: RecentPurchase[] = [];
  constructor(
    private authService: AuthService,
    private router: Router,
    private clientDashboardService: ClientDashboardService,
    private saleService: SaleService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserDetails();
    this.loadClientData();
  }
  private loadUserDetails() {
    if (!this.currentUser?.userId) {
      return;
    }

    this.userService.getUserById(this.currentUser.userId).subscribe({
      next: (user: User) => {
        this.userDetails = user;
        this.currentUser = {
          ...this.currentUser,
          name: user.name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          createdAt: user.registration_date
        };
      },
      error: (error) => {
        console.error('Error al cargar detalles del usuario:', error);
      }
    });
  }

  private loadClientData() {
    this.loading = true;
    this.error = null;

    if (!this.currentUser) {
      this.error = 'No hay usuario autenticado';
      this.loading = false;
      return;
    }

    this.saleService.getSalesByClient(this.currentUser.userId).subscribe({
      next: (sales: Sale[]) => {
        this.updateClientStats(sales);
        this.updateRecentOrders(sales);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del cliente:', error);
        this.error = 'Error al cargar los datos';
        this.loading = false;
        this.loadFallbackData();
      }
    });
  }

  private updateClientStats(sales: Sale[]) {
    const totalPurchases = sales.length;
    const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0);
    const pendingOrders = sales.filter(
      (sale) => sale.status.toLowerCase() === 'pendiente' || sale.status.toLowerCase() === 'en proceso'
    ).length;
    const deliveredOrders = sales.filter(
      (sale) => sale.status.toLowerCase() === 'completado' || sale.status.toLowerCase() === 'entregado'
    ).length;
    this.clientStats = {
      myOrders: totalPurchases,
      pendingOrders: pendingOrders,
      totalSpent: totalSpent,
      deliveredOrders: deliveredOrders
    };
  }

  private updateRecentOrders(sales: Sale[]) {
    const sortedSales = sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    this.recentOrders = sortedSales.slice(0, 5).map((sale) => ({
      saleId: sale.saleId,
      saleDate: sale.saleDate,
      total: sale.total,
      status: sale.status,
      itemCount: sale.saleDetails.reduce((sum, detail) => sum + detail.quantity, 0)
    }));
  }
  private loadFallbackData() {
    this.clientStats = {
      myOrders: 12,
      pendingOrders: 3,
      totalSpent: 3540.97,
      deliveredOrders: 9
    };
  }
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  trackOrder(orderId: number) {
    console.log('Rastreando pedido:', orderId);
    this.router.navigate(['/client/purchases', orderId]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completado':
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en proceso':
      case 'en tránsito':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'completado':
        return 'Completado';
      case 'entregado':
        return 'Entregado';
      case 'pendiente':
        return 'Pendiente';
      case 'en proceso':
        return 'En Proceso';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }

  formatMemberSince(): string {
    if (!this.currentUser?.createdAt) {
      return 'No disponible';
    }
    return new Date(this.currentUser.createdAt).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long'
    });
  }

  formatCurrencyPeru(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  openEditProfile(): void {
    console.log('Abriendo formulario de edición de perfil');

    this.router.navigate(['/client/profile/edit']);

  }

  private openEditProfileModal(): void {
    console.log('Modal de edición de perfil - por implementar');
  }
}
