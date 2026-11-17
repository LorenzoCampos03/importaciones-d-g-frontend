import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../../core/service/client.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Client, ClientRequest, ClientUpdateRequest } from '../../../core/interfaces/client.interface';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-client-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css'
})
export class ClientFormComponent implements OnInit {
  client: Partial<Client> = {
    username: '',
    name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    document_type: 'DNI',
    document_number: '',
    razon_social: '',
    status: 'A'
  };

  isEditMode = false;
  isLoading = false;
  currentUser: any = null;
  clientId: number | null = null;
  password = '';
  confirmPassword = '';

  documentTypes = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'Pasaporte', label: 'Pasaporte' },
    { value: 'Carnet de Extranjería', label: 'Carnet de Extranjería' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    const clientIdParam = this.route.snapshot.paramMap.get('id');
    if (clientIdParam) {
      this.clientId = parseInt(clientIdParam, 10);
      this.isEditMode = true;
      this.loadClient();
    }
  }

  loadClient() {
    if (this.clientId) {
      this.isLoading = true;
      this.clientService.getClientById(this.clientId).subscribe({
        next: (client) => {
          this.client = { ...client };
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading client:', error);
          this.isLoading = false;
          this.notificationService.error('No se pudo cargar la información del cliente');
          this.goBack();
        }
      });
    }
  }

  onSubmit() {
    if (this.validateForm()) {
      this.isLoading = true;

      if (this.isEditMode) {
        this.updateClient();
      } else {
        this.createClient();
      }
    }
  }

  createClient() {
    const clientData: ClientRequest = {
      username: this.client.username!,
      password: this.password,
      name: this.client.name!,
      last_name: this.client.last_name!,
      email: this.client.email!,
      phone: this.client.phone!,
      address: this.client.address!,
      document_type: this.client.document_type!,
      document_number: this.client.document_number!,
      razon_social: this.client.razon_social || undefined
    };

    this.clientService.createClient(clientData).subscribe({
      next: (newClient) => {
        this.isLoading = false;
        this.notificationService.success('Cliente creado exitosamente');
        this.router.navigate(['/admin/clients', newClient.user_id]);
      },
      error: (error) => {
        console.error('Error creating client:', error);
        this.isLoading = false;
        let errorMessage = 'No se pudo crear el cliente';
        if (error.status === 400) {
          errorMessage = 'Datos inválidos. Revisa la información ingresada';
        } else if (error.status === 409) {
          errorMessage = 'Ya existe un cliente con ese username o email';
        }
        this.notificationService.error(errorMessage);
      }
    });
  }

  updateClient() {
    if (this.clientId) {
      const clientData: ClientUpdateRequest = {
        user_id: this.clientId,
        username: this.client.username,
        name: this.client.name,
        last_name: this.client.last_name,
        email: this.client.email,
        phone: this.client.phone,
        address: this.client.address,
        document_type: this.client.document_type,
        document_number: this.client.document_number,
        razon_social: this.client.razon_social || undefined
      };

      this.clientService.updateClient(clientData).subscribe({
        next: (updatedClient) => {
          this.isLoading = false;
          this.notificationService.success('Cliente actualizado exitosamente');
          this.router.navigate(['/admin/clients', updatedClient.user_id]);
        },
        error: (error) => {
          console.error('Error updating client:', error);
          this.isLoading = false;
          let errorMessage = 'No se pudo actualizar el cliente';
          if (error.status === 400) {
            errorMessage = 'Datos inválidos. Revisa la información ingresada';
          } else if (error.status === 409) {
            errorMessage = 'Ya existe un cliente con ese username o email';
          }
          this.notificationService.error(errorMessage);
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.client.username?.trim()) {
      this.notificationService.error('El nombre de usuario es requerido');
      return false;
    }

    if (!this.client.name?.trim()) {
      this.notificationService.error('El nombre es requerido');
      return false;
    }

    if (!this.client.last_name?.trim()) {
      this.notificationService.error('El apellido es requerido');
      return false;
    }

    if (!this.client.email?.trim()) {
      this.notificationService.error('El email es requerido');
      return false;
    }

    if (!this.isValidEmail(this.client.email)) {
      this.notificationService.error('Ingresa un email válido');
      return false;
    }

    if (!this.client.phone?.trim()) {
      this.notificationService.error('El teléfono es requerido');
      return false;
    }

    if (!this.client.document_number?.trim()) {
      this.notificationService.error('El número de documento es requerido');
      return false;
    }

    if (!this.client.address?.trim()) {
      this.notificationService.error('La dirección es requerida');
      return false;
    }

    if (!this.isEditMode) {
      if (!this.password.trim()) {
        this.notificationService.error('La contraseña es requerida');
        return false;
      }

      if (this.password.length < 6) {
        this.notificationService.error('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      if (this.password !== this.confirmPassword) {
        this.notificationService.error('Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getPageTitle(): string {
    return this.isEditMode ? 'Editar Cliente' : 'Nuevo Cliente';
  }

  getPageDescription(): string {
    return this.isEditMode ?
      'Modifica la información del cliente' :
      'Registra un nuevo cliente en el sistema';
  }

  goBack() {
    if (this.isEditMode && this.clientId) {
      this.router.navigate(['/admin/clients', this.clientId]);
    } else {
      this.router.navigate(['/admin/clients']);
    }
  }
}
