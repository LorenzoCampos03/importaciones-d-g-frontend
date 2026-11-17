import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { PurchaseService } from '../../../../core/service/purchase.service';
import { ProductService } from '../../../../core/service/product.service';
import { AuthService } from '../../../../core/service/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Purchase, PurchaseStatus } from '../../../../core/interfaces/purchase.interface';
import { Product } from '../../../../core/interfaces/product.interface';

@Component({
     selector: 'app-admin-purchase-form',
     imports: [CommonModule, ReactiveFormsModule],
     templateUrl: './admin-purchase-form.component.html',
     styleUrl: './admin-purchase-form.component.css'
})
export class AdminPurchaseFormComponent implements OnInit {
     purchaseForm!: FormGroup;
     isEditMode = false;
     purchaseId: number | null = null;
     loading = false;
     loadingProducts = false;
     error: string | null = null;
     currentUser: any = null;

     products: Product[] = [];
     selectedProducts: Product[] = [];

     constructor(
          private fb: FormBuilder,
          private purchaseService: PurchaseService,
          private productService: ProductService,
          private authService: AuthService,
          private notificationService: NotificationService,
          private router: Router,
          private activatedRoute: ActivatedRoute
     ) {
          this.initializeForm();
     }

     ngOnInit(): void {
          this.currentUser = this.authService.getCurrentUser();
          this.loadProducts();

          const id = this.activatedRoute.snapshot.params['id'];
          if (id && id !== 'new') {
               this.isEditMode = true;
               this.purchaseId = +id;
               this.loadPurchase();
          }
     }

     initializeForm(): void {
          this.purchaseForm = this.fb.group({
               employeeId: [null, [Validators.required]],
               supplierId: [null, [Validators.required]],
               purchaseDate: [new Date().toISOString().split('T')[0], [Validators.required]],
               status: ['Pendiente', [Validators.required]],
               purchaseDetails: this.fb.array([])
          });

          // Add initial product detail
          this.addProductDetail();
     }

     get purchaseDetails(): FormArray {
          return this.purchaseForm.get('purchaseDetails') as FormArray;
     }

     loadProducts(): void {
          this.loadingProducts = true;
          this.productService.getAll().subscribe({
               next: (products) => {
                    this.products = products;
                    this.loadingProducts = false;
               },
               error: (error) => {
                    console.error('Error loading products:', error);
                    this.notificationService.error('Error al cargar los productos');
                    this.loadingProducts = false;
               }
          });
     }

     loadPurchase(): void {
          if (!this.purchaseId) return;

          this.loading = true;
          this.purchaseService.getPurchaseById(this.purchaseId).subscribe({
               next: (purchase) => {
                    this.populateForm(purchase);
                    this.loading = false;
               },
               error: (error) => {
                    console.error('Error loading purchase:', error);
                    this.error = 'Error al cargar la compra';
                    this.notificationService.error('Error al cargar la compra');
                    this.loading = false;
               }
          });
     }

     populateForm(purchase: Purchase): void {
          // Clear existing details
          while (this.purchaseDetails.length !== 0) {
               this.purchaseDetails.removeAt(0);
          }

          // Set basic form values
          this.purchaseForm.patchValue({
               employeeId: purchase.employeeId,
               supplierId: purchase.supplierId,
               purchaseDate: purchase.purchaseDate.split('T')[0],
               status: purchase.status
          });

          // Add purchase details
          purchase.purchaseDetails.forEach(detail => {
               const detailGroup = this.fb.group({
                    productId: [detail.productId, [Validators.required]],
                    quantity: [detail.quantity, [Validators.required, Validators.min(1)]],
                    unitCost: [detail.unitCost, [Validators.required, Validators.min(0.01)]],
                    totalCost: [{ value: detail.totalCost, disabled: true }]
               });

               this.purchaseDetails.push(detailGroup);
          });
     }

     addProductDetail(): void {
          const detailGroup = this.fb.group({
               productId: [null, [Validators.required]],
               quantity: [1, [Validators.required, Validators.min(1)]],
               unitCost: [0, [Validators.required, Validators.min(0.01)]],
               totalCost: [{ value: 0, disabled: true }]
          });

          // Subscribe to changes to calculate total
          detailGroup.get('quantity')?.valueChanges.subscribe(() => {
               this.calculateDetailTotal(detailGroup);
          });

          detailGroup.get('unitCost')?.valueChanges.subscribe(() => {
               this.calculateDetailTotal(detailGroup);
          });

          this.purchaseDetails.push(detailGroup);
     }

     removeProductDetail(index: number): void {
          if (this.purchaseDetails.length > 1) {
               this.purchaseDetails.removeAt(index);
          }
     }

     calculateDetailTotal(detailGroup: FormGroup): void {
          const quantity = detailGroup.get('quantity')?.value || 0;
          const unitCost = detailGroup.get('unitCost')?.value || 0;
          const total = quantity * unitCost;

          detailGroup.get('totalCost')?.setValue(total);
     }

     getTotalCost(): number {
          return this.purchaseDetails.controls.reduce((total, control) => {
               return total + (control.get('totalCost')?.value || 0);
          }, 0);
     }

     getProductName(productId: number): string {
          const product = this.products.find(p => p.productId === productId);
          return product ? product.name : 'Producto no encontrado';
     }

     onSubmit(): void {
          if (this.purchaseForm.invalid) {
               this.markFormGroupTouched(this.purchaseForm);
               return;
          }

          const formValue = this.purchaseForm.value;
          const purchase: Purchase = {
               ...formValue,
               totalCost: this.getTotalCost(),
               purchaseDetails: formValue.purchaseDetails.map((detail: any) => ({
                    ...detail,
                    totalCost: detail.quantity * detail.unitCost
               }))
          };

          if (this.isEditMode && this.purchaseId) {
               purchase.purchaseId = this.purchaseId;
               this.updatePurchase(purchase);
          } else {
               this.createPurchase(purchase);
          }
     }

     createPurchase(purchase: Purchase): void {
          this.loading = true;

          this.purchaseService.createPurchase(purchase).subscribe({
               next: (response) => {
                    this.notificationService.success('Compra creada exitosamente');
                    this.router.navigate(['/admin/purchases', response.purchaseId]);
               },
               error: (error) => {
                    console.error('Error creating purchase:', error);
                    this.notificationService.error('Error al crear la compra');
                    this.loading = false;
               }
          });
     }

     updatePurchase(purchase: Purchase): void {
          this.loading = true;

          this.purchaseService.updatePurchase(this.purchaseId!, purchase).subscribe({
               next: (response) => {
                    this.notificationService.success('Compra actualizada exitosamente');
                    this.router.navigate(['/admin/purchases', response.purchaseId]);
               },
               error: (error) => {
                    console.error('Error updating purchase:', error);
                    this.notificationService.error('Error al actualizar la compra');
                    this.loading = false;
               }
          });
     }

     private markFormGroupTouched(formGroup: FormGroup): void {
          Object.keys(formGroup.controls).forEach(key => {
               const control = formGroup.get(key);
               control?.markAsTouched();

               if (control instanceof FormGroup) {
                    this.markFormGroupTouched(control);
               } else if (control instanceof FormArray) {
                    control.controls.forEach(arrayControl => {
                         if (arrayControl instanceof FormGroup) {
                              this.markFormGroupTouched(arrayControl);
                         }
                    });
               }
          });
     }

     goBack(): void {
          this.router.navigate(['/admin/purchases']);
     }

     isFieldInvalid(fieldName: string): boolean {
          const field = this.purchaseForm.get(fieldName);
          return !!(field && field.invalid && (field.dirty || field.touched));
     }

     isDetailFieldInvalid(index: number, fieldName: string): boolean {
          const detail = this.purchaseDetails.at(index);
          const field = detail.get(fieldName);
          return !!(field && field.invalid && (field.dirty || field.touched));
     }

     getFieldError(fieldName: string): string {
          const field = this.purchaseForm.get(fieldName);
          if (field?.errors) {
               if (field.errors['required']) return 'Este campo es obligatorio';
               if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
          }
          return '';
     }

     getDetailFieldError(index: number, fieldName: string): string {
          const detail = this.purchaseDetails.at(index);
          const field = detail.get(fieldName);
          if (field?.errors) {
               if (field.errors['required']) return 'Este campo es obligatorio';
               if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
          }
          return '';
     }

     formatCurrency(amount: number): string {
          return new Intl.NumberFormat('es-PE', {
               style: 'currency',
               currency: 'PEN'
          }).format(amount);
     }

     getTotalItems(): number {
          return this.purchaseDetails.controls.reduce((sum, control) => {
               return sum + (control.get('quantity')?.value || 0);
          }, 0);
     }
}
