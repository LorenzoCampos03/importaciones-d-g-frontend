import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../../core/service/client.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Client } from '../../../core/interfaces/client.interface';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-client-detail',
  imports: [CommonModule],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css'
})
export class ClientDetailComponent implements OnInit {
  client: Client | null = null;
  isLoading = false;
  currentUser: any = null;
  showDeleteModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadClientDetail();
  }

  loadClientDetail() {
    const clientIdParam = this.route.snapshot.paramMap.get('id');

    if (!clientIdParam) {
      this.notificationService.error('ID de cliente no válido');
      this.goBack();
      return;
    }

    const clientId = parseInt(clientIdParam, 10);
    if (isNaN(clientId) || clientId <= 0) {
      this.notificationService.error('ID de cliente no válido');
      this.goBack();
      return;
    }

    this.isLoading = true;
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        this.client = client;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading client:', error);
        this.isLoading = false;

        if (error.status === 403) {
          this.notificationService.error('No tienes permisos para ver este cliente');
        } else if (error.status === 404) {
          this.notificationService.error('El cliente solicitado no existe');
        } else {
          this.notificationService.error('No se pudo cargar los detalles del cliente');
        }

        this.goBack();
      }
    });
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  confirmDeleteClient() {
    if (this.client) {
      this.isLoading = true;
      const clientName = `${this.client.name} ${this.client.last_name}`;

      this.clientService.logicalDeleteClient(this.client.user_id).subscribe({
        next: () => {
          this.client!.status = 'I';
          this.closeDeleteModal();
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

  restoreClient() {
    if (this.client) {
      this.isLoading = true;
      const clientName = `${this.client.name} ${this.client.last_name}`;

      this.clientService.restoreClient(this.client.user_id).subscribe({
        next: () => {
          this.client!.status = 'A';
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

  canDeleteClient(): boolean {
    return this.client?.status === 'A';
  }

  canRestoreClient(): boolean {
    return this.client?.status === 'I';
  }

  goBack() {
    this.router.navigate(['/admin/clients']);
  }
}
