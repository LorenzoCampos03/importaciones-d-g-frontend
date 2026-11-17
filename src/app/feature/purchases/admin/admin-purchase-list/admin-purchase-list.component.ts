import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../../../core/service/purchase.service';
import { AuthService } from '../../../../core/service/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { SupplierService, Supplier } from '../../../../core/service/supplier.service';
import { Purchase, PurchaseStatus } from '../../../../core/interfaces/purchase.interface';

@Component({
  selector: 'app-admin-purchase-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-purchase-list.component.html',
  styleUrl: './admin-purchase-list.component.css'
})
export class AdminPurchaseListComponent implements OnInit {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  suppliers: Supplier[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any = null;
  currentDate: Date = new Date();
  Math = Math;

  // Solo modal de confirmación para vista admin (sin edición)
  selectedPurchase: Purchase | null = null;

  // Filtros
  searchFilters = {
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    employeeId: ''
  };

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  constructor(
    private purchaseService: PurchaseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private supplierService: SupplierService,
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

    // Filtro por búsqueda
    if (this.searchFilters.search) {
      const search = this.searchFilters.search.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.purchaseId?.toString().includes(search) ||
        purchase.userName?.toLowerCase().includes(search) ||
        purchase.totalCost.toString().includes(search)
      );
    }

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
    this.totalPages = Math.ceil(this.filteredPurchases.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchFilters = {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      employeeId: ''
    };
    this.applyFilters();
  }

  getPaginatedPurchases(): Purchase[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPurchases.slice(startIndex, startIndex + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  viewPurchase(purchase: Purchase): void {
    this.router.navigate(['/admin/purchases', purchase.purchaseId]);
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

  getPendingPurchasesCount(): number {
    return this.purchases.filter(p => p.status === 'Pendiente').length;
  }

  getCompletedPurchasesCount(): number {
    return this.purchases.filter(p => p.status === 'Recibido').length;
  }

  getTotalInvestmentAmount(): number {
    return this.purchases.reduce((sum, p) => sum + p.totalCost, 0);
  }

  getMathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.supplierId === supplierId);
    return supplier ? supplier.supplierName : 'Proveedor no encontrado';
  }

  exportToCSV(): void {
    const csvData = this.filteredPurchases.map(purchase => ({
      ID: purchase.purchaseId,
      Empleado: purchase.userName,
      Fecha: this.formatDate(purchase.purchaseDate),
      Estado: purchase.status,
      Total: purchase.totalCost
    }));

    const csvContent = this.convertToCSV(csvData);
    this.downloadCSV(csvContent, 'compras.csv');
  }

  private convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }

  private downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
