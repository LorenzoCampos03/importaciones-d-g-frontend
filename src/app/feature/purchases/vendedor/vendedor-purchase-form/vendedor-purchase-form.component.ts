import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PurchaseService } from '../../../../core/service/purchase.service';
import { ProductService } from '../../../../core/service/product.service';
import { SupplierService, Supplier } from '../../../../core/service/supplier.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthService } from '../../../../core/service/auth.service';
import { Purchase, PurchaseStatus } from '../../../../core/interfaces/purchase.interface';
import { Product } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-vendedor-purchase-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vendedor-purchase-form.component.html',
  styleUrl: './vendedor-purchase-form.component.css'
})
export class VendedorPurchaseFormComponent implements OnInit {
  purchaseForm: FormGroup;
  products: Product[] = [];
  suppliers: Supplier[] = [];
  originalPurchase: Purchase | null = null;
  loading = false;
  isEditing = false;
  purchaseId: number | null = null;
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.purchaseForm = this.createForm();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProducts();
    this.loadSuppliers();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.purchaseId = +id;
      this.loadPurchase(this.purchaseId);
    } else {
      this.addProductDetail();
      // Establecer el employeeId del usuario actual
      this.purchaseForm.patchValue({
        employeeId: this.currentUser?.userId || this.currentUser?.id
      });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      employeeId: [this.currentUser?.userId || this.currentUser?.id || '', Validators.required],
      supplierId: ['', Validators.required], // Ahora requerimos selección
      purchaseDate: [new Date().toISOString().split('T')[0], Validators.required],
      status: ['Pendiente', Validators.required],
      purchaseDetails: this.fb.array([])
    });
  }

  get purchaseDetails(): FormArray {
    return this.purchaseForm.get('purchaseDetails') as FormArray;
  }

  createProductDetail(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  addProductDetail(): void {
    this.purchaseDetails.push(this.createProductDetail());
  }

  removeProductDetail(index: number): void {
    this.purchaseDetails.removeAt(index);
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (products: Product[]) => {
        this.products = products;
      },
      error: (error: any) => {
        console.error('Error loading products:', error);
        this.notificationService.error('Error al cargar los productos');
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getAll().subscribe({
      next: (suppliers: Supplier[]) => {
        this.suppliers = suppliers;
      },
      error: (error: any) => {
        console.error('Error loading suppliers:', error);
        this.notificationService.error('Error al cargar los proveedores');
      }
    });
  }

  loadPurchase(id: number): void {
    this.loading = true;
    this.purchaseService.getPurchaseById(id).subscribe({
      next: (purchase) => {
        this.populateForm(purchase);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading purchase:', error);
        this.notificationService.error('Error al cargar la compra');
        this.loading = false;
      }
    });
  } populateForm(purchase: Purchase): void {
    this.originalPurchase = purchase; // Guardar la compra original
    this.purchaseForm.patchValue({
      employeeId: purchase.employeeId,
      supplierId: purchase.supplierId,
      purchaseDate: purchase.purchaseDate,
      status: purchase.status
    });

    // Clear existing details
    while (this.purchaseDetails.length) {
      this.purchaseDetails.removeAt(0);
    }

    // Add purchase details
    if (purchase.purchaseDetails) {
      purchase.purchaseDetails.forEach(detail => {
        const detailForm = this.createProductDetail();
        detailForm.patchValue({
          productId: detail.productId,
          quantity: detail.quantity,
          unitCost: detail.unitCost
        });
        this.purchaseDetails.push(detailForm);
      });
    }
  }

  onProductChange(index: number): void {
    const productId = this.purchaseDetails.at(index).get('productId')?.value;
    const product = this.products.find(p => p.productId === +productId);

    if (product) {
      this.purchaseDetails.at(index).patchValue({
        unitCost: product.unitPrice || 0
      });
    }
  }

  calculateTotal(): number {
    return this.purchaseDetails.controls.reduce((total, detail) => {
      const quantity = detail.get('quantity')?.value || 0;
      const unitCost = detail.get('unitCost')?.value || 0;
      return total + (quantity * unitCost);
    }, 0);
  }

  onSubmit(): void {
    if (this.purchaseForm.valid) {
      const formData = { ...this.purchaseForm.value };
      formData.totalCost = this.calculateTotal();

      // Si estamos editando, preservar el estado original para no modificarlo
      if (this.isEditing && this.originalPurchase) {
        formData.status = this.originalPurchase.status;
      }

      this.loading = true;

      if (this.isEditing && this.purchaseId) {
        this.purchaseService.updatePurchase(this.purchaseId, formData).subscribe({
          next: () => {
            this.notificationService.success('Compra actualizada correctamente');
            this.router.navigate(['/seller/purchases']);
          },
          error: (error) => {
            console.error('Error updating purchase:', error);
            this.notificationService.error('Error al actualizar la compra');
            this.loading = false;
          }
        });
      } else {
        this.purchaseService.createPurchase(formData).subscribe({
          next: () => {
            this.notificationService.success('Compra creada correctamente');
            this.router.navigate(['/seller/purchases']);
          },
          error: (error) => {
            console.error('Error creating purchase:', error);
            this.notificationService.error('Error al crear la compra');
            this.loading = false;
          }
        });
      }
    } else {
      this.notificationService.error('Por favor, completa todos los campos requeridos');
    }
  }

  goBack(): void {
    this.router.navigate(['/seller/purchases']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.supplierId === supplierId);
    return supplier ? supplier.supplierName : 'Proveedor no encontrado';
  }
}
