import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SaleService } from '../../../core/service/sale.service';
import { ReportService } from '../../../core/service/report.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Sale } from '../../../core/interfaces/sale.interface';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-sale-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.css'
})
export class SaleListComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  currentUser: any = null;
  Math = Math;
  isLoading = false;
  showCancelModal = false;
  statusFilter = 'all';
  searchTerm = '';
  dateFilter = '';

  selectedSale: Sale | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private saleService: SaleService,
    private authService: AuthService,
    private reportService: ReportService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSales();
  }
  loadSales() {
    this.isLoading = true;
    this.saleService.getSales().subscribe({
      next: (allSales) => {
        if (this.currentUser?.role === 'Administrador') {
          this.sales = allSales;
        } else {
          const currentEmployeeId = this.currentUser?.userId;
          if (!currentEmployeeId) {
            console.error('No se encontró el userId del empleado');
            this.notificationService.error('No se pudo identificar al usuario');
            this.isLoading = false;
            return;
          }
          this.sales = allSales.filter((sale) => sale.employeeId === currentEmployeeId);
        }

        this.sales = this.sales.sort((a, b) => a.saleId - b.saleId);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sales:', error);
        this.isLoading = false;

        if (error.status === 0 || !navigator.onLine) {
          return;
        }

        let errorMessage = 'No se pudieron cargar las ventas';
        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Redirigiendo...';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver las ventas';
        } else if (error.status === 500) {
          errorMessage = 'Error del servidor. Intenta más tarde';
        }

        this.notificationService.error(errorMessage);
      }
    });
  }
  applyFilters() {
    this.filteredSales = this.sales.filter((sale) => {
      const matchesSearch =
        !this.searchTerm ||
        sale.clientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.saleId.toString().includes(this.searchTerm) ||
        sale.paymentMethod.toLowerCase().includes(this.searchTerm.toLowerCase());
      let matchesStatus = true;
      if (this.statusFilter === 'active') {
        matchesStatus = ['Pagado', 'Pendiente', 'Enviado'].includes(sale.status);
      } else if (this.statusFilter === 'inactive') {
        matchesStatus = sale.status === 'Cancelado';
      } else if (this.statusFilter !== 'all') {
        matchesStatus = sale.status === this.statusFilter;
      }

      const matchesDate = !this.dateFilter || sale.saleDate.startsWith(this.dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredSales.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedSales(): Sale[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSales.slice(start, end);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }
  onDateFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  getTotalSales(): number {
    return this.sales.length;
  }

  getActiveSales(): number {
    return this.sales.filter((sale) => ['Pagado', 'Pendiente', 'Enviado'].includes(sale.status)).length;
  }
  getCancelledSales(): number {
    return this.sales.filter((sale) => sale.status === 'Cancelado').length;
  }

  getTotalRevenue(): number {
    return this.sales.filter((sale) => sale.status === 'Pagado').reduce((total, sale) => total + sale.total, 0);
  }

  getPaidSales(): number {
    return this.sales.filter((sale) => sale.status === 'Pagado').length;
  }

  getPendingSales(): number {
    return this.sales.filter((sale) => sale.status === 'Pendiente').length;
  }

  getShippedSales(): number {
    return this.sales.filter((sale) => sale.status === 'Enviado').length;
  }
  viewSaleDetails(sale: Sale) {
    if (this.currentUser?.role === 'Administrador') {
      this.router.navigate(['/admin/sales', sale.saleId]);
    } else {
      this.router.navigate(['/seller/sales', sale.saleId]);
    }
  }

  openCancelModal(sale: Sale) {
    this.selectedSale = sale;
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.selectedSale = null;
  }
  confirmCancelSale() {
    if (this.selectedSale) {
      this.isLoading = true;
      const saleName = `Venta #${this.selectedSale.saleId}`;

      setTimeout(() => {
        if (this.selectedSale) {
          this.selectedSale.status = 'Cancelado';
          this.closeCancelModal();
          this.applyFilters();
          this.isLoading = false;
          this.notificationService.success(`${saleName} ha sido Cancelado correctamente`);
        }
      }, 1000);
    }
  }
  restoreSale(sale: Sale) {
    this.isLoading = true;
    const saleName = `Venta #${sale.saleId}`;

    setTimeout(() => {
      sale.status = 'Pagado';
      this.applyFilters();
      this.isLoading = false;
      this.notificationService.success(`${saleName} ha sido restaurada correctamente`);
    }, 1000);
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

  getStatusLabel(status: string): string {
    return status;
  }

  canCancelSale(sale: Sale): boolean {
    if (this.currentUser?.role === 'Administrador') {
      return false;
    }
    return ['Pagado', 'Pendiente'].includes(sale.status);
  }

  canRestoreSale(sale: Sale): boolean {
    if (this.currentUser?.role === 'Administrador') {
      return false;
    }
    return sale.status === 'Cancelado';
  }

  isActiveSale(sale: Sale): boolean {
    return ['Pagado', 'Pendiente', 'Enviado'].includes(sale.status);
  }

  canManageSales(): boolean {
    return this.currentUser?.role !== 'Administrador';
  }

  getPageTitle(): string {
    return this.currentUser?.role === 'Administrador' ? 'Todas las Ventas' : 'Mis Ventas';
  }

  getPageDescription(): string {
    if (this.currentUser?.role === 'Administrador') {
      return 'Gestión y supervisión de todas las ventas del sistema';
    }
    return `Historial de ventas realizadas por ${this.currentUser?.name}`;
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

  goBack() {
    if (this.currentUser?.role === 'Administrador') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/seller/dashboard']);
    }
  }

  createNewSale() {
    if (this.currentUser?.role === 'Vendedor') {
      this.router.navigate(['/seller/sales/new']);
    }
  }

  /**
   * Genera y descarga el reporte PDF de una venta
   */
  downloadReport(sale: Sale): void {
    if (!sale.saleId) {
      this.notificationService.error('ID de venta no válido');
      return;
    }

    this.notificationService.info('Generando reporte PDF...', 2000);

    this.reportService.generateSaleReport(sale.saleId).subscribe({
      next: (blob: Blob) => {
        const filename = `reporte_venta_${sale.saleId}.pdf`;
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
  viewReport(sale: Sale): void {
    if (!sale.saleId) {
      this.notificationService.error('ID de venta no válido');
      return;
    }

    this.notificationService.info('Abriendo reporte PDF...', 2000);

    this.reportService.generateSaleReport(sale.saleId).subscribe({
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
}
