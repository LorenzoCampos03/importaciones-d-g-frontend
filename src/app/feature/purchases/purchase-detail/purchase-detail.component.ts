import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SaleService } from '../../../core/service/sale.service';
import { ProductService } from '../../../core/service/product.service';
import { AuthService } from '../../../core/service/auth.service';
import { ReportService } from '../../../core/service/report.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Sale } from '../../../core/interfaces/sale.interface';
import { Product } from '../../../core/interfaces/product.interface';

@Component({
  selector: 'app-purchase-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.css'
})
export class PurchaseDetailComponent implements OnInit {
  purchase: Sale | null = null;
  loading = true;
  error: string | null = null;
  currentUser: any = null;
  isEditMode = false;

  availableProducts: Product[] = [];
  filteredProducts: Product[] = [];
  showAddProductModal = false;
  selectedProduct: Product | null = null;
  newProductQuantity = 1;
  productSearchTerm = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private productService: ProductService,
    private authService: AuthService,
    private reportService: ReportService,
    private notificationService: NotificationService
  ) { }
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPurchaseDetail();
    this.route.queryParams.subscribe((params) => {
      if (params['edit'] === 'true') {
        this.isEditMode = true;
        setTimeout(() => {
          this.notificationService.info(
            'Modo de edición activado. Puedes modificar las cantidades o eliminar productos.'
          );
        }, 500);
      }
    });
  }

  loadPurchaseDetail(): void {
    const saleId = this.route.snapshot.paramMap.get('id');

    if (!saleId || !this.currentUser) {
      this.error = 'ID de compra no válido o usuario no autenticado';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.saleService.getSaleById(Number(saleId)).subscribe({
      next: (sale) => {
        if (sale.clientId !== this.currentUser.userId) {
          this.error = 'No tienes permisos para ver esta compra';
          this.loading = false;
          return;
        }

        this.purchase = sale;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle de compra:', error);
        this.error = 'Error al cargar los detalles de la compra';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pagado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'enviado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  getTotalItems(): number {
    if (!this.purchase) return 0;
    return this.purchase.saleDetails.reduce((total, detail) => total + detail.quantity, 0);
  }
  downloadInvoice(): void {
    if (!this.purchase) {
      this.notificationService.error('No se encontró la información de la compra');
      return;
    }

    console.log('Descargando factura para la venta:', this.purchase.saleId);

    this.reportService.generateSaleReport(this.purchase.saleId).subscribe({
      next: (response) => {
        // El servicio ya maneja la descarga del archivo
        this.notificationService.success('Factura descargada exitosamente');
      },
      error: (error) => {
        console.error('Error al descargar la factura:', error);
        this.notificationService.error('Error al descargar la factura. Inténtelo nuevamente.');
      }
    });
  }

  canEditPurchase(): boolean {
    if (!this.purchase) return false;
    return this.purchase.status === 'Pendiente';
  }

  canPayPurchase(): boolean {
    if (!this.purchase) return false;
    return this.purchase.status === 'Pendiente';
  }

  canCancelPurchase(): boolean {
    if (!this.purchase) return false;
    return this.purchase.status === 'Pendiente';
  }
  toggleEditMode(): void {
    if (this.canEditPurchase()) {
      this.isEditMode = !this.isEditMode;

      if (this.isEditMode) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { edit: 'true' },
          queryParamsHandling: 'merge'
        });
      } else {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { edit: null },
          queryParamsHandling: 'merge'
        });
      }
    }
  }

  updateQuantity(detailId: number, newQuantity: number): void {
    if (!this.purchase || !this.canEditPurchase() || newQuantity <= 0) return;

    this.loading = true;
    this.saleService.updateSaleDetailQuantity(this.purchase.saleId, detailId, newQuantity).subscribe({
      next: (updatedSale: Sale) => {
        this.purchase = updatedSale;
        this.loading = false;
        this.notificationService.success('Cantidad actualizada correctamente');
      },
      error: (error: any) => {
        console.error('Error updating quantity:', error);
        this.loading = false;
        this.notificationService.error('No se pudo actualizar la cantidad');
      }
    });
  }

  removeDetail(detailId: number): void {
    if (!this.purchase || !this.canEditPurchase()) return;

    if (this.purchase.saleDetails.length <= 1) {
      this.notificationService.warning(
        'No se puede eliminar el último producto. Una compra debe tener al menos un producto.'
      );
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este producto de la compra?')) {
      this.loading = true;
      this.saleService.removeSaleDetail(this.purchase.saleId, detailId).subscribe({
        next: (updatedSale: Sale) => {
          this.purchase = updatedSale;
          this.loading = false;
          this.notificationService.success('Producto eliminado correctamente');
        },
        error: (error: any) => {
          console.error('Error removing detail:', error);
          this.loading = false;
          const errorMessage = error.error?.message || error.message || 'No se pudo eliminar el producto';
          this.notificationService.error(errorMessage);
        }
      });
    }
  }

  payPurchase(): void {
    if (!this.purchase || !this.canPayPurchase()) return;

    if (confirm(`¿Confirmas el pago de la compra #${this.purchase.saleId} por S/ ${this.purchase.total.toFixed(2)}?`)) {
      this.loading = true;

      this.saleService.updateSaleStatus(this.purchase.saleId, 'Pagado').subscribe({
        next: (updatedSale) => {
          this.purchase = updatedSale;
          this.loading = false;
          this.notificationService.success(`Compra #${this.purchase.saleId} ha sido pagada correctamente`);
        },
        error: (error) => {
          console.error('Error paying purchase:', error);
          this.loading = false;
          this.notificationService.error('No se pudo procesar el pago');
        }
      });
    }
  }

  cancelPurchase(): void {
    if (!this.purchase || !this.canCancelPurchase()) return;

    if (confirm(`¿Estás seguro de que deseas cancelar la compra #${this.purchase.saleId}?`)) {
      this.loading = true;

      this.saleService.updateSaleStatus(this.purchase.saleId, 'Cancelado').subscribe({
        next: (updatedSale) => {
          this.purchase = updatedSale;
          this.loading = false;
          this.notificationService.success(`Compra #${this.purchase.saleId} ha sido cancelada correctamente`);
        },
        error: (error) => {
          console.error('Error canceling purchase:', error);
          this.loading = false;
          this.notificationService.error('No se pudo cancelar la compra');
        }
      });
    }
  }
  onQuantityChange(event: any, detailId: number): void {
    const newQuantity = parseInt(event.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      this.updateQuantity(detailId, newQuantity);
    }
  }

  loadAvailableProducts(): void {
    console.log('loadAvailableProducts() - Iniciando carga de productos');
    console.log('canEditPurchase():', this.canEditPurchase());
    console.log('Usuario actual:', this.currentUser);

    if (this.canEditPurchase()) {
      console.log('Llamando a productService.getAvailableProducts()');
      this.productService.getAvailableProducts().subscribe({
        next: (products: Product[]) => {
          console.log('Productos cargados del servidor:', products);

          const existingProductIds =
            this.purchase?.saleDetails
              .map((detail) => detail.productId)
              .filter((id): id is number => id !== undefined) || [];

          console.log('IDs de productos existentes:', existingProductIds);

          this.availableProducts = products.filter(
            (product) => product.productId !== undefined && !existingProductIds.includes(product.productId)
          );

          this.filteredProducts = this.availableProducts;
          console.log('Productos disponibles después del filtro:', this.availableProducts);
          console.log('Productos filtrados inicializados:', this.filteredProducts);
        },
        error: (error: any) => {
          console.error('Error loading products:', error);
          console.error('Status del error:', error.status);
          console.error('Mensaje del error:', error.message);
          this.notificationService.error(
            'No se pudieron cargar los productos disponibles: ' + (error.error?.message || error.message)
          );
        }
      });
    } else {
      console.warn('No se pueden cargar productos - canEditPurchase() retornó false');
    }
  }

  openAddProductModal(): void {
    console.log('openAddProductModal() - Modal de agregar producto abierto');
    this.loadAvailableProducts();
    this.showAddProductModal = true;
    this.selectedProduct = null;
    this.newProductQuantity = 1;
    this.productSearchTerm = '';
    console.log('Modal configurado - showAddProductModal:', this.showAddProductModal);
  }

  filterProducts(): void {
    if (!this.productSearchTerm.trim()) {
      this.filteredProducts = this.availableProducts;
    } else {
      this.filteredProducts = this.availableProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(this.productSearchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(this.productSearchTerm.toLowerCase())
      );
    }
  }

  closeAddProductModal(): void {
    this.showAddProductModal = false;
    this.selectedProduct = null;
    this.newProductQuantity = 1;
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
  }

  confirmAddProduct(): void {
    if (!this.selectedProduct || !this.purchase) return;

    if (this.newProductQuantity <= 0) {
      this.notificationService.warning('La cantidad debe ser mayor a 0');
      return;
    }

    if (this.newProductQuantity > this.selectedProduct.stock) {
      this.notificationService.warning(`Stock insuficiente. Disponible: ${this.selectedProduct.stock}`);
      return;
    }

    this.loading = true;
    const detailData = {
      productId: this.selectedProduct.productId,
      quantity: this.newProductQuantity,
      unitPrice: this.selectedProduct.unitPrice
    };

    this.saleService.addSaleDetailToSale(this.purchase.saleId, detailData).subscribe({
      next: (updatedSale: Sale) => {
        this.purchase = updatedSale;
        this.closeAddProductModal();
        this.loading = false;
        this.notificationService.success(`${this.selectedProduct!.name} agregado a la compra correctamente`);
      },
      error: (error: any) => {
        console.error('Error adding product:', error);
        this.loading = false;
        const errorMessage = error.error?.message || error.message || 'No se pudo agregar el producto a la compra';
        this.notificationService.error(errorMessage);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/client/purchases']);
  }
}
