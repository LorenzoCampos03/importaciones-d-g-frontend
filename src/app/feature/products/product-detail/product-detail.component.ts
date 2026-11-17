import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/service/product.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from '../../../core/service/auth.service';
import { Product } from '../../../core/interfaces/product.interface';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = false;
  productId: string | null = null;
  currentUser: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}
  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.route.params.subscribe((params) => {
      this.productId = params['id'];
      if (this.productId) {
        this.loadProduct(parseInt(this.productId));
      } else {
        this.goBack();
      }
    });
  }

  loadProduct(productId: number) {
    this.isLoading = true;
    this.productService.getById(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.notificationService.error('No se pudo cargar el producto');
        this.isLoading = false;
        this.goBack();
      }
    });
  }
  editProduct() {
    if (this.product) {
      const editRoute = this.currentUser?.role === 'Administrador' ? '/admin/products/edit' : '/seller/products/edit';
      this.router.navigate([editRoute, this.product.productId]);
    }
  }
  deleteProduct() {
    if (this.product && this.product.productId) {
      if (confirm(`¿Estás seguro de que deseas desactivar el producto "${this.product.name}"?`)) {
        this.isLoading = true;
        this.productService.deactivate(this.product.productId).subscribe({
          next: () => {
            this.notificationService.success(`El producto "${this.product!.name}" ha sido desactivado correctamente`);
            this.goBack();
          },
          error: (error) => {
            console.error('Error deactivating product:', error);
            this.isLoading = false;
            this.notificationService.error('No se pudo desactivar el producto. Inténtalo de nuevo.');
          }
        });
      }
    }
  }
  restoreProduct() {
    if (this.product && this.product.productId) {
      if (confirm(`¿Estás seguro de que deseas restaurar el producto "${this.product.name}"?`)) {
        this.isLoading = true;
        this.productService.reactivateProduct(this.product.productId).subscribe({
          next: () => {
            this.notificationService.success(`El producto "${this.product!.name}" ha sido restaurado correctamente`);
            this.product!.status = 'A';
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error restoring product:', error);
            this.isLoading = false;
            this.notificationService.error('No se pudo restaurar el producto. Inténtalo de nuevo.');
          }
        });
      }
    }
  }

  getStockStatusClass(): string {
    if (!this.product) return '';

    if (this.product.stock < 10) return 'bg-red-100 text-red-800';
    if (this.product.stock < 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getStatusClass(): string {
    if (!this.product) return '';

    return this.product.status === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  goBack() {
    if (this.currentUser?.role === 'Administrador') {
      this.router.navigate(['/admin/products']);
    } else {
      this.router.navigate(['/seller/products']);
    }
  }
}
