import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfficeService } from '../../../core/service/office.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Office } from '../../../core/interfaces/office.interface';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-location-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './location-list.component.html',
  styleUrl: './location-list.component.css'
})
export class LocationListComponent implements OnInit {
  offices: Office[] = [];
  filteredOffices: Office[] = [];
  currentUser: any = null;
  Math = Math;
  isLoading = false;
  showDeleteModal = false;
  statusFilter = 'all';
  searchTerm = '';
  selectedOffice: Office | null = null;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private officeService: OfficeService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadOffices();
  }

  loadOffices() {
    this.isLoading = true;
    this.officeService.getAllOffices().subscribe({
      next: (offices) => {
        this.offices = offices.sort((a, b) => (a.office_id! - b.office_id!));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading offices:', error);
        this.isLoading = false;
        if (error.status === 0 || !navigator.onLine) {
          return;
        }
        let errorMessage = 'No se pudieron cargar las oficinas';
        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Redirigiendo...';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver las oficinas';
        }
        this.notificationService.error(errorMessage);
      }
    });
  }

  applyFilters() {
    this.filteredOffices = this.offices.filter(office => {
      const matchesSearch = !this.searchTerm ||
        office.office_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        office.address.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        office.city.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        office.phone.includes(this.searchTerm);

      let matchesStatus = true;
      if (this.statusFilter === 'active') {
        matchesStatus = office.status === 'A';
      } else if (this.statusFilter === 'inactive') {
        matchesStatus = office.status === 'I';
      }

      return matchesSearch && matchesStatus;
    });

    this.filteredOffices.sort((a, b) => (a.office_id! - b.office_id!));
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredOffices.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedOffices(): Office[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredOffices.slice(start, end);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getTotalOffices(): number {
    return this.offices.length;
  }

  getActiveOffices(): number {
    return this.offices.filter(office => office.status === 'A').length;
  }

  getInactiveOffices(): number {
    return this.offices.filter(office => office.status === 'I').length;
  }

  viewOfficeDetails(office: Office) {
    this.router.navigate(['/admin/locations', office.office_id]);
  }

  openDeleteModal(office: Office) {
    this.selectedOffice = office;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedOffice = null;
  }

  confirmDeleteOffice() {
    if (this.selectedOffice) {
      this.isLoading = true;
      const officeName = this.selectedOffice.office_name;

      this.officeService.logicalDeleteOffice(this.selectedOffice.office_id!).subscribe({
        next: () => {
          this.selectedOffice!.status = 'I';
          this.closeDeleteModal();
          this.applyFilters();
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

  restoreOffice(office: Office) {
    this.isLoading = true;
    const officeName = office.office_name;

    this.officeService.restoreOffice(office.office_id!).subscribe({
      next: () => {
        office.status = 'A';
        this.applyFilters();
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

  canDeleteOffice(office: Office): boolean {
    return office.status === 'A';
  }

  canRestoreOffice(office: Office): boolean {
    return office.status === 'I';
  }

  navigateToCreate() {
    this.router.navigate(['/admin/locations/create']);
  }

  editOffice(office: Office) {
    this.router.navigate(['/admin/locations/edit', office.office_id]);
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }
}
