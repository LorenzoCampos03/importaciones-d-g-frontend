import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { SaleService } from '../../../core/service/sale.service';
import { ReportService } from '../../../core/service/report.service';
import { ProductService } from '../../../core/service/product.service';
import { UserService } from '../../../core/service/user.service';
import { AuthService } from '../../../core/service/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Product } from '../../../core/interfaces/product.interface';
import { User } from '../../../core/interfaces/user';

interface SaleDetail {
  productId: number;
  productName: string;
  productDescription: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  maxStock: number;
}

@Component({
  selector: 'app-sale-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sale-form.component.html',
  styleUrl: './sale-form.component.css'
})
export class SaleFormComponent implements OnInit {
  saleForm: FormGroup;
  currentUser: any = null;
  isLoading = false;
  isSubmitting = false;

  showClientModal = false;
  showProductModal = false;

  clients: User[] = [];
  products: Product[] = [];
  filteredClients: User[] = [];
  filteredProducts: Product[] = [];

  selectedClient: User | null = null;
  saleDetails: SaleDetail[] = [];

  clientSearchTerm = '';
  productSearchTerm = '';

  paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'];
  deliveryMethods = ['Recojo en tienda', 'Delivery', 'Envío a domicilio'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private saleService: SaleService,
    private reportService: ReportService,
    private productService: ProductService,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.saleForm = this.fb.group({
      paymentMethod: ['', [Validators.required]],
      deliveryMethod: ['', [Validators.required]],
      deliveryAddress: ['']
    });
  }
  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserData();
    this.loadData();
    this.setupFormValidation();
  }

  loadUserData() {
    if (this.currentUser?.userId) {
      this.userService.getEmployeeById(this.currentUser.userId).subscribe({
        next: (user) => {
          this.currentUser = {
            ...this.currentUser,
            office_id: user.office_id,
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
          };
          console.log('Usuario completo cargado:', this.currentUser);
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.notificationService.error('Error al cargar datos del usuario');
        }
      });
    }
  }

  loadData() {
    this.isLoading = true;

    this.userService.getActiveUsers().subscribe({
      next: (users) => {
        this.clients = users.filter((user) => user.role === 'Cliente');
        this.filteredClients = [...this.clients];
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.notificationService.error('Error al cargar clientes');
      }
    });

    this.productService.getByStatus('A').subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...this.products];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.notificationService.error('Error al cargar productos');
        this.isLoading = false;
      }
    });
  }

  setupFormValidation() {
    this.saleForm.get('deliveryMethod')?.valueChanges.subscribe((value) => {
      const deliveryAddressControl = this.saleForm.get('deliveryAddress');
      if (value === 'Delivery' || value === 'Envío a domicilio') {
        deliveryAddressControl?.setValidators([Validators.required]);
      } else {
        deliveryAddressControl?.clearValidators();
      }
      deliveryAddressControl?.updateValueAndValidity();
    });
  }

  openClientModal() {
    this.showClientModal = true;
    this.clientSearchTerm = '';
    this.filteredClients = [...this.clients];
  }

  closeClientModal() {
    this.showClientModal = false;
    this.clientSearchTerm = '';
  }

  searchClients() {
    if (!this.clientSearchTerm.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }
    const term = this.clientSearchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.last_name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term)
    );
  }
  selectClient(client: User) {
    this.selectedClient = client;
    this.closeClientModal();
    this.notificationService.success(`Cliente seleccionado: ${client.name} ${client.last_name}`);
  }

  clearSelectedClient() {
    this.selectedClient = null;
    this.notificationService.info('Cliente deseleccionado');
  }

  openProductModal() {
    this.showProductModal = true;
    this.productSearchTerm = '';
    this.filteredProducts = [...this.products];
  }

  closeProductModal() {
    this.showProductModal = false;
    this.productSearchTerm = '';
  }

  searchProducts() {
    if (!this.productSearchTerm.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const term = this.productSearchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(
      (product) => product.name.toLowerCase().includes(term) || product.description.toLowerCase().includes(term)
    );
  }
  addProduct(product: Product) {
    const existingIndex = this.saleDetails.findIndex((detail) => detail.productId === product.productId!);

    if (existingIndex >= 0) {
      if (this.saleDetails[existingIndex].quantity < product.stock) {
        this.saleDetails[existingIndex].quantity++;
        this.calculateSubtotal(existingIndex);
        this.notificationService.success(`Cantidad incrementada para ${product.name}`);
      } else {
        this.notificationService.warning(`Stock insuficiente para ${product.name}`);
      }
    } else {
      if (product.stock > 0) {
        const newDetail: SaleDetail = {
          productId: product.productId!,
          productName: product.name,
          productDescription: product.description,
          unitPrice: product.unitPrice,
          quantity: 1,
          subtotal: product.unitPrice,
          maxStock: product.stock
        };
        this.saleDetails.push(newDetail);
        this.notificationService.success(`${product.name} agregado a la venta`);
      } else {
        this.notificationService.warning(`${product.name} sin stock disponible`);
      }
    }

    this.closeProductModal();
  }

  updateQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeProduct(index);
      return;
    }

    if (newQuantity > this.saleDetails[index].maxStock) {
      this.notificationService.warning('Cantidad supera el stock disponible');
      this.saleDetails[index].quantity = this.saleDetails[index].maxStock;
    } else {
      this.saleDetails[index].quantity = newQuantity;
    }

    this.calculateSubtotal(index);
  }

  calculateSubtotal(index: number) {
    const detail = this.saleDetails[index];
    detail.subtotal = detail.quantity * detail.unitPrice;
  }

  removeProduct(index: number) {
    const productName = this.saleDetails[index].productName;
    this.saleDetails.splice(index, 1);
    this.notificationService.info(`${productName} eliminado de la venta`);
  }

  getTotalAmount(): number {
    return this.saleDetails.reduce((total, detail) => total + detail.subtotal, 0);
  }
  canSubmit(): boolean {
    return this.selectedClient !== null && this.saleDetails.length > 0 && this.saleForm.valid && !this.isSubmitting;
  }

  onSubmit() {
    if (!this.canSubmit()) {
      this.notificationService.warning('Complete todos los campos requeridos');
      return;
    }

    if (!this.currentUser.office_id) {
      this.notificationService.error('Error: No se pudo determinar la oficina del usuario');
      return;
    }

    this.isSubmitting = true;

    const saleData = {
      client_id: this.selectedClient!.user_id,
      employee_id: this.currentUser.userId,
      office_id: this.currentUser.office_id,
      payment_method: this.saleForm.get('paymentMethod')?.value,
      delivery_method: this.saleForm.get('deliveryMethod')?.value,
      delivery_address: this.saleForm.get('deliveryAddress')?.value || null,
      saleDetails: this.saleDetails.map((detail) => ({
        productId: detail.productId,
        quantity: detail.quantity
      }))
    };

    console.log('Datos a enviar:', saleData);

    this.saleService.createSale(saleData).subscribe({
      next: (result) => {
        this.notificationService.success('Venta creada exitosamente');

        // Generar y descargar automáticamente el reporte PDF
        if (result && result.saleId) {
          this.generateReportAfterSale(result.saleId);
        }

        this.router.navigate(['/seller/sales']);
      },
      error: (error) => {
        console.error('Error creating sale:', error);
        this.notificationService.error('Error al crear la venta');
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Genera automáticamente el reporte PDF después de crear una venta
   */
  private generateReportAfterSale(saleId: number): void {
    this.notificationService.info('Generando reporte de venta...', 3000);

    this.reportService.generateSaleReport(saleId).subscribe({
      next: (blob: Blob) => {
        const filename = `reporte_venta_${saleId}.pdf`;
        this.reportService.downloadPdf(blob, filename);
        this.notificationService.success('Reporte de venta descargado automáticamente');
      },
      error: (error) => {
        console.error('Error al generar reporte automático:', error);
        this.notificationService.warning('Venta creada, pero hubo un error al generar el reporte');
      }
    });
  }

  goBack() {
    this.router.navigate(['/seller/sales']);
  }
}
