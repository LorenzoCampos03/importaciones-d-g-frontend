import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OfficeService } from '../../../core/service/office.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Office } from '../../../core/interfaces/office.interface';

@Component({
  selector: 'app-location-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-form.component.html',
  styleUrl: './location-form.component.css'
})
export class LocationFormComponent implements OnInit {
  officeForm!: FormGroup;
  isEditMode = false;
  officeId: number | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private officeService: OfficeService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.officeId = +params['id'];
        this.loadOfficeData();
      }
    });
  }

  initForm() {
    this.officeForm = this.fb.group({
      office_name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]]
    });
  }

  loadOfficeData() {
    if (this.officeId) {
      this.isLoading = true;
      this.officeService.getOfficeById(this.officeId).subscribe({
        next: (office) => {
          this.officeForm.patchValue({
            office_name: office.office_name,
            address: office.address,
            city: office.city,
            phone: office.phone
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading office:', error);
          this.notificationService.error('No se pudo cargar la oficina');
          this.router.navigate(['/admin/locations']);
          this.isLoading = false;
        }
      });
    }
  }

  onSubmit() {
    if (this.officeForm.valid) {
      this.isLoading = true;
      const formData = this.officeForm.value;

      if (this.isEditMode && this.officeId) {
        const updateData: Office = {
          office_id: this.officeId,
          ...formData,
          status: 'A'
        };

        this.officeService.updateOffice(updateData).subscribe({
          next: () => {
            this.notificationService.success('Oficina actualizada correctamente');
            this.router.navigate(['/admin/locations']);
          },
          error: (error) => {
            console.error('Error updating office:', error);
            this.notificationService.error('No se pudo actualizar la oficina');
            this.isLoading = false;
          }
        });
      } else {
        const newOffice = {
          ...formData,
          status: 'A'
        };

        this.officeService.createOffice(newOffice).subscribe({
          next: () => {
            this.notificationService.success('Oficina creada correctamente');
            this.router.navigate(['/admin/locations']);
          },
          error: (error) => {
            console.error('Error creating office:', error);
            this.notificationService.error('No se pudo crear la oficina');
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.officeForm.controls).forEach(key => {
      const control = this.officeForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.officeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.officeForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} es obligatorio`;
      if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['pattern']) return `${fieldName} tiene un formato inválido`;
    }
    return '';
  }

  goBack() {
    this.router.navigate(['/admin/locations']);
  }
}
