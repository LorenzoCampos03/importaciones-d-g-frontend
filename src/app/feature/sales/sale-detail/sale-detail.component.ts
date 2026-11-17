import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SaleService } from '../../../core/service/sale.service';
import { ReportService } from '../../../core/service/report.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Sale } from '../../../core/interfaces/sale.interface';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-sale-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.css'
})
export class SaleDetailComponent implements OnInit {
  sale: Sale | null = null;
  isLoading = false;
  currentUser: any = null;
  isEditMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private reportService: ReportService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSaleDetail();
  }
  loadSaleDetail() {
    const saleIdParam = this.route.snapshot.paramMap.get('id');

    if (!saleIdParam) {
      this.notificationService.error('ID de venta no válido');
      this.goBack();
      return;
    }

    const saleId = parseInt(saleIdParam, 10);
    if (isNaN(saleId) || saleId <= 0) {
      this.notificationService.error('ID de venta no válido');
      this.goBack();
      return;
    }

    this.isLoading = true;
    this.saleService.getSaleById(saleId).subscribe({
      next: (sale) => {
        if (this.currentUser?.role === 'Vendedor' && sale.employeeId !== this.currentUser?.userId) {
          this.notificationService.error('No tienes permisos para ver esta venta');
          this.goBack();
          return;
        }

        if (this.currentUser?.role === 'Cliente' && sale.clientId !== this.currentUser?.userId) {
          this.notificationService.error('No tienes permisos para ver esta compra');
          this.goBack();
          return;
        }

        this.sale = sale;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sale:', error);
        this.isLoading = false;

        if (error.status === 403) {
          this.notificationService.error('No tienes permisos para ver esta venta');
        } else if (error.status === 404) {
          this.notificationService.error('La venta solicitada no existe');
        } else {
          this.notificationService.error('No se pudo cargar los detalles de la venta');
        }

        this.goBack();
      }
    });
  }
  canCancelSale(): boolean {
    if (!this.sale) return false;

    if (this.currentUser?.role === 'Administrador') {
      return false;
    }

    if (this.currentUser?.role === 'Cliente') {
      return this.sale.status === 'Pendiente';
    }

    return ['Pagado', 'Pendiente'].includes(this.sale.status);
  }

  canRestoreSale(): boolean {
    if (!this.sale) return false;

    if (this.currentUser?.role === 'Administrador') {
      return false;
    }

    if (this.currentUser?.role === 'Cliente') {
      return false;
    }

    return this.sale.status === 'Cancelado';
  }

  canEditSale(): boolean {
    if (!this.sale) return false;

    if (this.currentUser?.role === 'Administrador') {
      return false;
    }

    if (this.sale.status !== 'Pendiente') return false;

    if (this.currentUser?.role === 'Cliente') {
      return this.sale.clientId === this.currentUser?.userId;
    }

    if (this.currentUser?.role === 'Vendedor') {
      return this.sale.employeeId === this.currentUser?.userId;
    }

    return false;
  }

  canManageSale(): boolean {
    return this.currentUser?.role !== 'Administrador';
  }

  canPaySale(): boolean {
    if (!this.sale) return false;

    if (this.currentUser?.role === 'Cliente') {
      return this.sale.status === 'Pendiente' && this.sale.clientId === this.currentUser?.userId;
    }

    return false;
  }
  cancelSale() {
    if (!this.sale || !this.canCancelSale()) return;

    const saleText = this.currentUser?.role === 'Cliente' ? 'compra' : 'venta';
    if (confirm(`¿Estás seguro de que deseas cancelar la ${saleText} #${this.sale.saleId}?`)) {
      this.isLoading = true;

      this.saleService.updateSaleStatus(this.sale.saleId, 'Cancelado').subscribe({
        next: (updatedSale) => {
          this.sale = updatedSale;
          this.isLoading = false;
          this.notificationService.success(
            `${saleText.charAt(0).toUpperCase() + saleText.slice(1)} #${this.sale.saleId} ha sido cancelada correctamente`
          );
        },
        error: (error) => {
          console.error('Error canceling sale:', error);
          this.isLoading = false;
          this.notificationService.error(`No se pudo cancelar la ${saleText}`);
        }
      });
    }
  }

  paySale() {
    if (!this.sale || !this.canPaySale()) return;

    if (confirm(`¿Confirmas el pago de la compra #${this.sale.saleId} por S/ ${this.sale.total.toFixed(2)}?`)) {
      this.isLoading = true;

      this.saleService.updateSaleStatus(this.sale.saleId, 'Pagado').subscribe({
        next: (updatedSale) => {
          this.sale = updatedSale;
          this.isLoading = false;
          this.notificationService.success(`Compra #${this.sale.saleId} ha sido pagada correctamente`);
        },
        error: (error) => {
          console.error('Error paying sale:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo procesar el pago');
        }
      });
    }
  }
  restoreSale() {
    if (!this.sale || !this.canRestoreSale()) return;

    if (confirm(`¿Estás seguro de que deseas restaurar la venta #${this.sale.saleId}?`)) {
      this.isLoading = true;

      this.saleService.updateSaleStatus(this.sale.saleId, 'Pagado').subscribe({
        next: (updatedSale) => {
          this.sale = updatedSale;
          this.isLoading = false;
          this.notificationService.success(`Venta #${this.sale.saleId} ha sido restaurada correctamente`);
        },
        error: (error) => {
          console.error('Error restoring sale:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo restaurar la venta');
        }
      });
    }
  }



  getStatusClass(status: string): string {
    switch (status) {
      case 'Pagado':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPaymentMethodClass(method: string): string {
    switch (method.toLowerCase()) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'transferencia':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  toggleEditMode() {
    if (this.canEditSale()) {
      this.isEditMode = !this.isEditMode;
    }
  }

  updateQuantity(detailId: number, newQuantity: number) {
    if (!this.sale || !this.canEditSale() || newQuantity <= 0) return;

    this.isLoading = true;
    this.saleService.updateSaleDetailQuantity(this.sale.saleId, detailId, newQuantity).subscribe({
      next: (updatedSale) => {
        this.sale = updatedSale;
        this.isLoading = false;
        this.notificationService.success('Cantidad actualizada correctamente');
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        this.isLoading = false;
        this.notificationService.error('No se pudo actualizar la cantidad');
      }
    });
  }

  removeDetail(detailId: number) {
    if (!this.sale || !this.canEditSale()) return;

    if (confirm('¿Estás seguro de que deseas eliminar este producto de la compra?')) {
      this.isLoading = true;
      this.saleService.removeSaleDetail(this.sale.saleId, detailId).subscribe({
        next: (updatedSale) => {
          this.sale = updatedSale;
          this.isLoading = false;
          this.notificationService.success('Producto eliminado correctamente');
        },
        error: (error) => {
          console.error('Error removing detail:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo eliminar el producto');
        }
      });
    }
  }

  onQuantityChange(event: any, detailId: number) {
    const newQuantity = parseInt(event.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      this.updateQuantity(detailId, newQuantity);
    }
  }

  goBack() {
    const role = this.currentUser?.role;
    if (role === 'Vendedor') {
      this.router.navigate(['/seller/sales']);
    } else if (role === 'Administrador') {
      this.router.navigate(['/admin/sales']);
    } else if (role === 'Cliente') {
      this.router.navigate(['/client/sales']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Genera y descarga el reporte PDF de la venta
   */
  downloadReport(): void {
    if (!this.sale?.saleId) {
      this.notificationService.error('ID de venta no válido');
      return;
    }

    this.notificationService.info('Generando reporte PDF...', 2000);

    this.reportService.generateSaleReport(this.sale.saleId).subscribe({
      next: (blob: Blob) => {
        const filename = `reporte_venta_${this.sale!.saleId}.pdf`;
        this.reportService.downloadPdf(blob, filename);
        this.notificationService.success('Reporte descargado correctamente');
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        this.notificationService.error('Error al generar el reporte PDF');
      }
    });
  }

  /**
   * Abre el reporte PDF en una nueva pestaña
   */
  viewReport(): void {
    if (!this.sale?.saleId) {
      this.notificationService.error('ID de venta no válido');
      return;
    }

    this.notificationService.info('Abriendo reporte PDF...', 2000);

    this.reportService.generateSaleReport(this.sale.saleId).subscribe({
      next: (blob: Blob) => {
        this.reportService.openPdfInNewTab(blob);
        this.notificationService.success('Reporte abierto en nueva pestaña');
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        this.notificationService.error('Error al generar el reporte PDF');
      }
    });
  }

  /**
   * Verifica si se puede generar reporte para esta venta
   */
  canGenerateReport(): boolean {
    return this.sale?.status === 'Pagado' || this.sale?.status === 'Enviado';
  }
}
