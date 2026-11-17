import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { PurchaseService } from '../../../../core/service/purchase.service';
import { SupplierService, Supplier } from '../../../../core/service/supplier.service';
import { AuthService } from '../../../../core/service/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Purchase, PurchaseStatus } from '../../../../core/interfaces/purchase.interface';

@Component({
     selector: 'app-admin-purchase-detail',
     imports: [CommonModule, RouterLink],
     templateUrl: './admin-purchase-detail.component.html',
     styleUrl: './admin-purchase-detail.component.css'
})
export class AdminPurchaseDetailComponent implements OnInit {
     purchase: Purchase | null = null;
     suppliers: Supplier[] = [];
     loading = true;
     error: string | null = null;
     currentUser: any = null;

     constructor(
          private purchaseService: PurchaseService,
          private supplierService: SupplierService,
          private authService: AuthService,
          private notificationService: NotificationService,
          private router: Router,
          private activatedRoute: ActivatedRoute
     ) { }

     ngOnInit(): void {
          this.currentUser = this.authService.getCurrentUser();
          this.loadSuppliers();
          this.loadPurchase();
     }

     loadPurchase(): void {
          const purchaseId = this.activatedRoute.snapshot.params['id'];
          if (!purchaseId) {
               this.error = 'ID de compra no válido';
               this.loading = false;
               return;
          }

          this.loading = true;
          this.error = null;

          this.purchaseService.getPurchaseById(+purchaseId).subscribe({
               next: (purchase) => {
                    this.purchase = purchase;
                    this.loading = false;
               },
               error: (error) => {
                    console.error('Error loading purchase:', error);
                    this.error = 'Error al cargar los detalles de la compra';
                    this.loading = false;
                    this.notificationService.error('Error al cargar la compra');
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
               }
          });
     }

     getSupplierName(supplierId: number): string {
          const supplier = this.suppliers.find(s => s.supplierId === supplierId);
          return supplier ? supplier.supplierName : 'Proveedor no encontrado';
     }

     goBack(): void {
          this.router.navigate(['/admin/purchases']);
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

     formatDate(date: string): string {
          return new Date(date).toLocaleDateString('es-PE', {
               year: 'numeric',
               month: 'long',
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
          });
     }

     printPurchase(): void {
          window.print();
     }

     exportToPDF(): void {
          // Implementar exportación a PDF si es necesario
          this.notificationService.info('Función de exportación a PDF en desarrollo');
     }
}
