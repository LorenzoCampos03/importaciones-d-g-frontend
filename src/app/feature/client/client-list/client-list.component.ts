import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../../core/service/client.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Client } from '../../../core/interfaces/client.interface';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-client-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css'
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  currentUser: any = null;
  Math = Math;
  isLoading = false;
  showDeleteModal = false;
  statusFilter = 'all';
  searchTerm = '';
  selectedClient: Client | null = null;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private clientService: ClientService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadClients();
  }

  loadClients() {
    this.isLoading = true;
    this.clientService.getAllClients().subscribe({
      next: (clients) => {
        this.clients = clients.sort((a, b) => {
          const fullNameA = `${a.name} ${a.last_name}`.toLowerCase();
          const fullNameB = `${b.name} ${b.last_name}`.toLowerCase();
          return fullNameA.localeCompare(fullNameB);
        });
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.isLoading = false;
        if (error.status === 0 || !navigator.onLine) {
          return;
        }
        let errorMessage = 'No se pudieron cargar los clientes';
        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Redirigiendo...';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver los clientes';
        }
        this.notificationService.error(errorMessage);
      }
    });
  }

  applyFilters() {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.searchTerm ||
        client.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.last_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.document_number.includes(this.searchTerm);

      let matchesStatus = true;
      if (this.statusFilter === 'active') {
        matchesStatus = client.status === 'A';
      } else if (this.statusFilter === 'inactive') {
        matchesStatus = client.status === 'I';
      }

      return matchesSearch && matchesStatus;
    });

    this.filteredClients.sort((a, b) => {
      const fullNameA = `${a.name} ${a.last_name}`.toLowerCase();
      const fullNameB = `${b.name} ${b.last_name}`.toLowerCase();
      return fullNameA.localeCompare(fullNameB);
    });
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedClients(): Client[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredClients.slice(start, end);
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

  getTotalClients(): number {
    return this.clients.length;
  }

  getActiveClients(): number {
    return this.clients.filter(client => client.status === 'A').length;
  }

  getInactiveClients(): number {
    return this.clients.filter(client => client.status === 'I').length;
  }

  viewClientDetails(client: Client) {
    this.router.navigate(['/admin/clients', client.user_id]);
  }

  openDeleteModal(client: Client) {
    this.selectedClient = client;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedClient = null;
  }

  confirmDeleteClient() {
    if (this.selectedClient) {
      this.isLoading = true;
      const clientName = `${this.selectedClient.name} ${this.selectedClient.last_name}`;

      this.clientService.logicalDeleteClient(this.selectedClient.user_id).subscribe({
        next: () => {
          this.selectedClient!.status = 'I';
          this.closeDeleteModal();
          this.applyFilters();
          this.isLoading = false;
          this.notificationService.success(`Cliente ${clientName} ha sido desactivado correctamente`);
        },
        error: (error) => {
          console.error('Error deleting client:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo desactivar el cliente');
        }
      });
    }
  }

  restoreClient(client: Client) {
    this.isLoading = true;
    const clientName = `${client.name} ${client.last_name}`;

    this.clientService.restoreClient(client.user_id).subscribe({
      next: () => {
        client.status = 'A';
        this.applyFilters();
        this.isLoading = false;
        this.notificationService.success(`Cliente ${clientName} ha sido restaurado correctamente`);
      },
      error: (error) => {
        console.error('Error restoring client:', error);
        this.isLoading = false;
        this.notificationService.error('No se pudo restaurar el cliente');
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

  canDeleteClient(client: Client): boolean {
    return client.status === 'A';
  }

  canRestoreClient(client: Client): boolean {
    return client.status === 'I';
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }
}
