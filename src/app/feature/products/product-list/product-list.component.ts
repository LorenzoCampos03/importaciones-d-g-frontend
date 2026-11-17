import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/service/product.service';
import { CategoryService, Category } from '../../../core/service/category.service';
import { SupplierService, Supplier } from '../../../core/service/supplier.service';
import { BrandService, Brand } from '../../../core/service/brand.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Product } from '../../../core/interfaces/product.interface';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  currentUser: any = null;
  Math = Math;

  isLoading = false;
  showDeleteModal = false;

  statusFilter = 'A';
  searchTerm = '';

  selectedProduct: Product | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private brandService: BrandService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.productService.getByStatus(this.statusFilter).subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.notificationService.error('No se pudieron cargar los productos');
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredProducts = this.products.filter((product) => {
      const matchesSearch =
        !this.searchTerm ||
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.categoryName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.supplierName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.brandName.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesSearch;
    });

    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProducts.slice(start, end);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }
  onStatusFilterChange() {
    this.loadProducts();
  }

  createProduct(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const newRoute = this.currentUser?.role === 'Administrador' ? '/admin/products/new' : '/seller/products/new';
    this.router.navigate([newRoute]);
  }
  editProduct(product: Product) {
    const editRoute = this.currentUser?.role === 'Administrador' ? '/admin/products/edit' : '/seller/products/edit';
    this.router.navigate([editRoute, product.productId]);
  }

  viewProduct(product: Product) {
    const viewRoute = this.currentUser?.role === 'Administrador' ? '/admin/products' : '/seller/products';
    this.router.navigate([viewRoute, product.productId]);
  }

  openDeleteModal(product: Product) {
    this.selectedProduct = product;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedProduct = null;
  }

  confirmDelete() {
    if (this.selectedProduct) {
      this.isLoading = true;
      const productName = this.selectedProduct.name;

      this.productService.deactivate(this.selectedProduct.productId!).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.loadProducts();
          this.isLoading = false;

          this.notificationService.success(`El producto "${productName}" ha sido desactivado correctamente`);
        },
        error: (error) => {
          console.error('Error deactivating product:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo desactivar el producto. Inténtalo de nuevo.');
        }
      });
    }
  }

  restoreProduct(product: Product) {
    this.isLoading = true;
    this.productService.reactivateProduct(product.productId!).subscribe({
      next: () => {
        this.loadProducts();
        this.isLoading = false;
        this.notificationService.success(`El producto "${product.name}" ha sido reactivado correctamente`);
      },
      error: (error) => {
        console.error('Error restoring product:', error);
        this.isLoading = false;
        this.notificationService.error('No se pudo reactivar el producto. Inténtalo de nuevo.');
      }
    });
  }
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getTotalProducts(): number {
    return this.products.length;
  }

  getActiveProducts(): number {
    return this.products.filter((product) => product.status === 'A').length;
  }

  getInactiveProducts(): number {
    return this.products.filter((product) => product.status === 'I').length;
  }

  getTotalStock(): number {
    return this.products
      .filter((product) => product.status === 'A')
      .reduce((total, product) => total + product.stock, 0);
  }

  getTotalInventoryValue(): number {
    return this.products
      .filter((product) => product.status === 'A')
      .reduce((total, product) => total + product.unitPrice * product.stock, 0);
  }

  goBack() {
    if (this.currentUser?.role === 'Administrador') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/seller/dashboard']);
    }
  }

  generateReport() {
    this.isLoading = true

    this.productService.generateProductReport().subscribe({
      next: (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob)

        // Crear elemento de descarga
        const link = document.createElement("a")
        link.href = url
        link.download = `reporte_productos_${new Date().toISOString().split("T")[0]}.pdf`

        // Simular click para descargar
        document.body.appendChild(link)
        link.click()

        // Limpiar
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.isLoading = false
        this.notificationService.success("Reporte generado y descargado correctamente")
      },
      error: (error) => {
        console.error("Error generating report:", error)
        this.isLoading = false
        this.notificationService.error("No se pudo generar el reporte. Inténtalo de nuevo.")
      },
    })
  }
}
