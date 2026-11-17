import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../../../core/service/purchase.service';
import { SupplierService, Supplier } from '../../../../core/service/supplier.service';
import { AuthService } from '../../../../core/service/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Purchase, PurchaseStatus } from '../../../../core/interfaces/purchase.interface';

@Component({
  selector: 'app-vendedor-purchase-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './vendedor-purchase-list.component.html',
  styleUrl: './vendedor-purchase-list.component.css'
})
export class VendedorPurchaseListComponent implements OnInit {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  suppliers: Supplier[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any = null;

  // Modales
  showStatusModal = false;
  showCancelModal = false;
  selectedPurchase: Purchase | null = null;
  newStatus: PurchaseStatus = 'Pendiente';

  // Filtros
  searchFilters = {
    status: '',
    dateFrom: '',
    dateTo: ''
  };

  constructor(
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSuppliers();
    this.loadPurchases();
  }

  loadSuppliers(): void {
    this.supplierService.getAll().subscribe({
      next: (suppliers: Supplier[]) => {
        this.suppliers = suppliers;
      },
      error: (error: any) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  loadPurchases(): void {
    this.loading = true;
    this.error = null;

    this.purchaseService.getAllPurchases().subscribe({
      next: (purchases) => {
        // Filtrar solo las compras del vendedor actual si es necesario
        this.purchases = purchases;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading purchases:', error);
        this.error = 'Error al cargar las compras';
        this.loading = false;
        this.notificationService.error('Error al cargar las compras');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.purchases];

    // Filtro por estado
    if (this.searchFilters.status) {
      filtered = filtered.filter(purchase => purchase.status === this.searchFilters.status);
    }

    // Filtro por rango de fechas
    if (this.searchFilters.dateFrom) {
      filtered = filtered.filter(purchase =>
        new Date(purchase.purchaseDate) >= new Date(this.searchFilters.dateFrom)
      );
    }

    if (this.searchFilters.dateTo) {
      filtered = filtered.filter(purchase =>
        new Date(purchase.purchaseDate) <= new Date(this.searchFilters.dateTo)
      );
    }

    this.filteredPurchases = filtered;
  }

  clearFilters(): void {
    this.searchFilters = {
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  viewPurchase(purchase: Purchase): void {
    this.router.navigate(['/seller/purchases', purchase.purchaseId]);
  }

  editPurchase(purchase: Purchase): void {
    this.router.navigate(['/seller/purchases/edit', purchase.purchaseId]);
  }

  createNewPurchase(): void {
    this.router.navigate(['/seller/purchases/new']);
  }

  openStatusModal(purchase: Purchase): void {
    this.selectedPurchase = purchase;
    this.newStatus = purchase.status;
    this.showStatusModal = true;
  }

  updateStatus(): void {
    if (!this.selectedPurchase) return;

    const updatedPurchase = { ...this.selectedPurchase, status: this.newStatus };

    this.purchaseService.updatePurchase(this.selectedPurchase.purchaseId!, updatedPurchase).subscribe({
      next: () => {
        this.notificationService.success('Estado actualizado correctamente');
        this.loadPurchases();
        this.closeStatusModal();
      },
      error: (error) => {
        console.error('Error updating purchase status:', error);
        this.notificationService.error('Error al actualizar el estado');
      }
    });
  }

  openCancelModal(purchase: Purchase): void {
    this.selectedPurchase = purchase;
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (!this.selectedPurchase) return;

    this.purchaseService.cancelPurchase(this.selectedPurchase.purchaseId!).subscribe({
      next: (response: string) => {
        console.log('Respuesta del servidor:', response);
        this.notificationService.success('Compra cancelada correctamente');
        this.loadPurchases();
        this.closeCancelModal();
      },
      error: (error: any) => {
        console.error('Error canceling purchase:', error);
        // Si el error incluye texto de éxito, tratarlo como éxito
        if (error.message && error.message.includes('Compra Cancelado exitosamente')) {
          this.notificationService.success('Compra cancelada correctamente');
          this.loadPurchases();
          this.closeCancelModal();
        } else {
          this.notificationService.error('Error al cancelar la compra');
        }
      }
    });
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedPurchase = null;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedPurchase = null;
  }

  getStatusColor(status: PurchaseStatus): string {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pagado':
        return 'bg-blue-100 text-blue-800';
      case 'Recibido':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Métodos para estadísticas (similar al componente de cliente)
  getTotalSpent(): number {
    return this.purchases.reduce((sum, p) => sum + p.totalCost, 0);
  }

  getAverageOrder(): number {
    return this.purchases.length > 0 ? this.getTotalSpent() / this.purchases.length : 0;
  }

  getPendingPurchasesCount(): number {
    return this.purchases.filter(p => p.status === 'Pendiente').length;
  }

  getCompletedPurchasesCount(): number {
    return this.purchases.filter(p => p.status === 'Recibido').length;
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.supplierId === supplierId);
    return supplier ? supplier.supplierName : 'Proveedor no encontrado';
  }

  generateReport(purchase: Purchase): void {
  // AGREGAR ESTOS CONSOLE.LOG PARA DEBUGGEAR
  console.log('=== DEBUG REPORTE ===');
  console.log('Purchase completo:', purchase);
  console.log('Purchase ID:', purchase.purchaseId);
  console.log('Purchase status:', purchase.status);
  console.log('Purchase totalCost:', purchase.totalCost);
  console.log('====================');

  if (!purchase.purchaseId) {
    this.notificationService.error('ID de compra no válido');
    return;
  }

  this.loading = true;

  this.purchaseService.generatePurchaseReport(purchase.purchaseId).subscribe({
    next: (blob: Blob) => {
      console.log('PDF generado exitosamente para ID:', purchase.purchaseId);

      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);

      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_compra_${purchase.purchaseId}.pdf`;

      console.log('Nombre del archivo:', `reporte_compra_${purchase.purchaseId}.pdf`);

      // Simular click para descargar
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.loading = false;
      this.notificationService.success('Reporte generado y descargado correctamente');
    },
    error: (error) => {
      console.error('Error generating purchase report:', error);
      console.error('Purchase ID que falló:', purchase.purchaseId);
      this.loading = false;
      this.notificationService.error('No se pudo generar el reporte. Inténtalo de nuevo.');
    }
  });
}

}
