import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Purchase } from '../../../../core/interfaces/purchase.interface';
import { PurchaseService } from '../../../../core/service/purchase.service';
import { SupplierService, Supplier } from '../../../../core/service/supplier.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-vendedor-purchase-detail',
  imports: [CommonModule],
  templateUrl: './vendedor-purchase-detail.component.html',
  styleUrl: './vendedor-purchase-detail.component.css'
})
export class VendedorPurchaseDetailComponent implements OnInit {
  purchase: Purchase | null = null;
  suppliers: Supplier[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSuppliers();
      this.loadPurchase(+id);
    }
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

  loadPurchase(id: number): void {
    this.loading = true;
    this.purchaseService.getPurchaseById(id).subscribe({
      next: (purchase) => {
        this.purchase = purchase;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading purchase:', error);
        this.error = 'Error al cargar la compra';
        this.loading = false;
        this.notificationService.error('Error al cargar la compra');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/seller/purchases']);
  }

  editPurchase(): void {
    if (this.purchase) {
      this.router.navigate(['/seller/purchases/edit', this.purchase.purchaseId]);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.supplierId === supplierId);
    return supplier ? supplier.supplierName : 'Proveedor no encontrado';
  }
}
