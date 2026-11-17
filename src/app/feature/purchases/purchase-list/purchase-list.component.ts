import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../../core/service/sale.service';
import { AuthService } from '../../../core/service/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Sale } from '../../../core/interfaces/sale.interface';
import { PurchaseService } from '../../../core/service/purchase.service';

@Component({
  selector: 'app-purchase-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './purchase-list.component.html',
  styleUrl: './purchase-list.component.css'
})
export class PurchaseListComponent implements OnInit {
  purchases: Sale[] = [];
  filteredPurchases: Sale[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any = null;

  showPaymentModal = false;
  showCancelModal = false;
  selectedPurchase: Sale | null = null;

  searchFilters = {
    status: '',
    dateFrom: '',
    dateTo: ''
  };

  constructor(
    private saleService: SaleService,
    private purchaseService: PurchaseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPurchases();
  }
  loadPurchases(): void {
    if (!this.currentUser) {
      this.error = 'No hay usuario autenticado';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;
    this.saleService.getSalesByClient(this.currentUser.userId).subscribe({
      next: (sales) => {
        this.purchases = sales.sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
        this.filteredPurchases = [...this.purchases];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar compras:', error);
        this.error = 'Error al cargar las compras';
        this.loading = false;
      }
    });
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
      month: 'long',
      day: 'numeric'
    });
  }
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pagado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'enviado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'pagado':
        return 'Pagado';
      case 'enviado':
        return 'Enviado';
      case 'pendiente':
        return 'Pendiente';
      case 'Cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }
  getTotalItems(sale: Sale): number {
    return sale.saleDetails.reduce((total, detail) => total + detail.quantity, 0);
  }

  getTotalSpent(): number {
    return this.purchases.reduce((total, purchase) => total + purchase.total, 0);
  }

  getAverageOrder(): number {
    if (this.purchases.length === 0) return 0;
    return this.getTotalSpent() / this.purchases.length;
  }

  viewPurchaseDetails(purchaseId: number): void {
    this.router.navigate(['/client/purchases', purchaseId]);
  }

  applyFilters(): void {
    this.filteredPurchases = this.purchases.filter((purchase) => {
      if (this.searchFilters.status && purchase.status.toLowerCase() !== this.searchFilters.status.toLowerCase()) {
        return false;
      }

      const purchaseDate = new Date(purchase.saleDate);
      if (this.searchFilters.dateFrom) {
        const fromDate = new Date(this.searchFilters.dateFrom);
        if (purchaseDate < fromDate) {
          return false;
        }
      }

      if (this.searchFilters.dateTo) {
        const toDate = new Date(this.searchFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (purchaseDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }
  clearFilters(): void {
    this.searchFilters = {
      status: 'Todos los estados',
      dateFrom: '',
      dateTo: ''
    };
    this.filteredPurchases = [...this.purchases];
  }
  downloadInvoice(saleId: number): void {
    console.log('Descargando factura para la venta:', saleId);
    this.notificationService.info('Función de descarga de factura en desarrollo');
  }

  canEditPurchase(purchase: Sale): boolean {
    return purchase.status === 'Pendiente';
  }

  canPayPurchase(purchase: Sale): boolean {
    return purchase.status === 'Pendiente';
  }
  canCancelPurchase(purchase: Sale): boolean {
    return purchase.status === 'Pendiente';
  }

  canRestorePurchase(purchase: Sale): boolean {
    return purchase.status === 'Cancelado';
  }

  editPurchase(purchase: Sale): void {
    if (this.canEditPurchase(purchase)) {
      this.router.navigate(['/client/purchases', purchase.saleId], {
        queryParams: { edit: 'true' }
      });
    } else {
      this.notificationService.warning('Solo puedes editar compras pendientes');
    }
  }

  openPaymentModal(purchase: Sale): void {
    if (this.canPayPurchase(purchase)) {
      this.selectedPurchase = purchase;
      this.showPaymentModal = true;
    } else {
      this.notificationService.warning('Esta compra ya no está pendiente');
    }
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedPurchase = null;
  }

  confirmPayment(): void {
    if (this.selectedPurchase) {
      this.loading = true;
      const purchaseName = `Compra #${this.selectedPurchase.saleId}`;

      this.saleService.updateSaleStatus(this.selectedPurchase.saleId, 'Pagado').subscribe({
        next: (updatedSale) => {
          const index = this.purchases.findIndex((p) => p.saleId === this.selectedPurchase!.saleId);
          if (index !== -1) {
            this.purchases[index] = updatedSale;
          }
          this.closePaymentModal();
          this.applyFilters();
          this.loading = false;
          this.notificationService.success(`${purchaseName} ha sido pagada correctamente`);
        },
        error: (error) => {
          console.error('Error paying purchase:', error);
          this.loading = false;
          this.notificationService.error('No se pudo procesar el pago');
        }
      });
    }
  }

  openCancelModal(purchase: Sale): void {
    if (this.canCancelPurchase(purchase)) {
      this.selectedPurchase = purchase;
      this.showCancelModal = true;
    } else {
      this.notificationService.warning('Solo puedes cancelar compras pendientes');
    }
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedPurchase = null;
  }

  confirmCancel(): void {
    if (this.selectedPurchase) {
      this.loading = true;
      const purchaseName = `Compra #${this.selectedPurchase.saleId}`;

      this.saleService.updateSaleStatus(this.selectedPurchase.saleId, 'Cancelado').subscribe({
        next: (updatedSale) => {
          const index = this.purchases.findIndex((p) => p.saleId === this.selectedPurchase!.saleId);
          if (index !== -1) {
            this.purchases[index] = updatedSale;
          }
          this.closeCancelModal();
          this.applyFilters();
          this.loading = false;
          this.notificationService.success(`${purchaseName} ha sido cancelada correctamente`);
        },
        error: (error) => {
          console.error('Error canceling purchase:', error);
          this.loading = false;
          this.notificationService.error('No se pudo cancelar la compra');
        }
      });
    }
  }

  getPendingPurchases(): number {
    return this.purchases.filter((p) => p.status === 'Pendiente').length;
  }

  getPaidPurchases(): number {
    return this.purchases.filter((p) => p.status === 'Pagado').length;
  }
  getCancelledPurchases(): number {
    return this.purchases.filter((p) => p.status === 'Cancelado').length;
  }

  restorePurchase(purchase: Sale): void {
    if (this.canRestorePurchase(purchase)) {
      if (confirm(`¿Estás seguro de que deseas restaurar la compra #${purchase.saleId}?`)) {
        this.loading = true;
        const purchaseName = `Compra #${purchase.saleId}`;

        this.saleService.updateSaleStatus(purchase.saleId, 'Pagado').subscribe({
          next: (updatedSale) => {
            const index = this.purchases.findIndex((p) => p.saleId === purchase.saleId);
            if (index !== -1) {
              this.purchases[index] = updatedSale;
            }
            this.applyFilters();
            this.loading = false;
            this.notificationService.success(`${purchaseName} ha sido restaurada correctamente`);
          },
          error: (error) => {
            console.error('Error restoring purchase:', error);
            this.loading = false;
            this.notificationService.error('No se pudo restaurar la compra. Posiblemente no hay stock suficiente.');
          }
        });
      }
    } else {
      this.notificationService.warning('Solo puedes restaurar compras canceladas');
    }
  }

}
