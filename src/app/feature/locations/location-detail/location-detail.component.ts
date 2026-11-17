import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OfficeService } from '../../../core/service/office.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Office } from '../../../core/interfaces/office.interface';

@Component({
  selector: 'app-location-detail',
  imports: [CommonModule],
  templateUrl: './location-detail.component.html',
  styleUrl: './location-detail.component.css'
})
export class LocationDetailComponent implements OnInit {
  office: Office | null = null;
  isLoading = false;
  showDeleteModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private officeService: OfficeService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOffice(parseInt(id));
    }
  }

  loadOffice(id: number) {
    this.isLoading = true;
    this.officeService.getOfficeById(id).subscribe({
      next: (office) => {
        this.office = office;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading office:', error);
        this.isLoading = false;
        if (error.status === 0 || !navigator.onLine) {
          return;
        }
        let errorMessage = 'No se pudo cargar la información de la oficina';
        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Redirigiendo...';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver esta oficina';
        } else if (error.status === 404) {
          errorMessage = 'La oficina no fue encontrada';
        }
        this.notificationService.error(errorMessage);
        this.router.navigate(['/admin/locations']);
      }
    });
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  confirmDeleteOffice() {
    if (this.office) {
      this.isLoading = true;
      const officeName = this.office.office_name;

      this.officeService.logicalDeleteOffice(this.office.office_id!).subscribe({
        next: () => {
          this.office!.status = 'I';
          this.closeDeleteModal();
          this.isLoading = false;
          this.notificationService.success(`Oficina ${officeName} ha sido desactivada correctamente`);
        },
        error: (error) => {
          console.error('Error deleting office:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo desactivar la oficina');
        }
      });
    }
  }

  restoreOffice() {
    if (this.office) {
      this.isLoading = true;
      const officeName = this.office.office_name;

      this.officeService.restoreOffice(this.office.office_id!).subscribe({
        next: () => {
          this.office!.status = 'A';
          this.isLoading = false;
          this.notificationService.success(`Oficina ${officeName} ha sido restaurada correctamente`);
        },
        error: (error) => {
          console.error('Error restoring office:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo restaurar la oficina');
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'I': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'A': return 'Activo';
      case 'I': return 'Inactivo';
      default: return 'Desconocido';
    }
  }

  canDeleteOffice(): boolean {
    return this.office?.status === 'A';
  }

  canRestoreOffice(): boolean {
    return this.office?.status === 'I';
  }

  goBack() {
    this.router.navigate(['/admin/locations']);
  }
}
