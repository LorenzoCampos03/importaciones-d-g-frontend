import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/service/product.service';
import { CategoryService, Category } from '../../../core/service/category.service';
import { SupplierService, Supplier } from '../../../core/service/supplier.service';
import { BrandService, Brand } from '../../../core/service/brand.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from '../../../core/service/auth.service';
import { Product } from '../../../core/interfaces/product.interface';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditing = false;
  isLoading = false;
  productId: string | null = null;
  currentUser: any = null;

  categories: Category[] = [];
  suppliers: Supplier[] = [];
  brands: Brand[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private brandService: BrandService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.productForm = this.createForm();
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadFormData();
    this.checkEditMode();
  }

  createForm(): FormGroup {
    return this.fb.group({
      productId: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryName: ['', Validators.required],
      supplierName: ['', Validators.required],
      brandName: ['', Validators.required],
      status: ['A']
    });
  }

  loadFormData() {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.notificationService.error('No se pudieron cargar las categorías');
      }
    });

    this.supplierService.getAll().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.notificationService.error('No se pudieron cargar los proveedores');
      }
    });

    this.brandService.getAll().subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.notificationService.error('No se pudieron cargar las marcas');
      }
    });
  }
  checkEditMode() {
    this.route.params.subscribe((params) => {
      this.productId = params['id'];
      this.isEditing = !!this.productId;

      if (this.isEditing && this.productId) {
        this.loadProductData(parseInt(this.productId));
      }
    });
  }

  loadProductData(productId: number) {
    this.isLoading = true;
    this.productService.getById(productId).subscribe({
      next: (product) => {
        this.productForm.patchValue(product);
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

  onSubmit() {
    if (this.productForm.valid) {
      const formData = this.productForm.value;

      if (this.isEditing) {
        this.updateProduct(formData);
      } else {
        this.createProduct(formData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  createProduct(productData: Product) {
    this.isLoading = true;
    this.productService.create(productData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notificationService.success(`El producto "${productData.name}" se ha creado correctamente`);
        this.goBack();
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.isLoading = false;
        this.notificationService.error('No se pudo crear el producto. Verifica los datos e inténtalo de nuevo.');
      }
    });
  }

  updateProduct(productData: Product) {
    this.isLoading = true;
    this.productService.update(productData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notificationService.success(`El producto "${productData.name}" se ha actualizado correctamente`);
        this.goBack();
      },
      error: (error) => {
        console.error('Error updating product:', error);
        this.isLoading = false;
        this.notificationService.error('No se pudo actualizar el producto. Verifica los datos e inténtalo de nuevo.');
      }
    });
  }

  markFormGroupTouched() {
    Object.keys(this.productForm.controls).forEach((key) => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors) {
      const fieldLabels: { [key: string]: string } = {
        name: 'El nombre del producto',
        description: 'La descripción',
        unitPrice: 'El precio unitario',
        stock: 'El stock inicial',
        categoryName: 'La categoría',
        supplierName: 'El proveedor',
        brandName: 'La marca'
      };

      const fieldLabel = fieldLabels[fieldName] || fieldName;

      if (field.errors['required']) return `${fieldLabel} es requerido`;
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        if (fieldName === 'name') {
          return `${fieldLabel} debe tener al menos ${requiredLength} caracteres`;
        }
        if (fieldName === 'description') {
          return `${fieldLabel} debe tener al menos ${requiredLength} caracteres`;
        }
        return `${fieldLabel} debe tener al menos ${requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        if (fieldName === 'unitPrice') {
          return `${fieldLabel} debe ser mayor a S/ ${field.errors['min'].min}`;
        }
        if (fieldName === 'stock') {
          return `${fieldLabel} no puede ser negativo`;
        }
        return `${fieldLabel} debe ser mayor a ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  goBack() {
    if (this.currentUser?.role === 'Administrador') {
      this.router.navigate(['/admin/products']);
    } else {
      this.router.navigate(['/seller/products']);
    }
  }

  cancel() {
    this.goBack();
  }
}
