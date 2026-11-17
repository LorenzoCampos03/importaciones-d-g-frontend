import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/service/auth.service';
import { UserService } from '../../../core/service/user.service';
import { CustomValidators } from '../../../core/validators/custom-validators';
import { User } from '../../../core/interfaces/user';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profileForm: FormGroup;
  currentUser: any = null;
  userDetails: User | null = null;
  loading = false;
  isSubmitting = false;
  error: string | null = null;
  showSuccessMessage = false;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordStrength = { level: '', score: 0, class: '' };

  documentTypes = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CNE', label: 'Carnet de Extranjería' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser?.userId) {
      this.router.navigate(['/client/dashboard']);
      return;
    }
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private createForm(): FormGroup {
    const form = this.fb.group({
      firstName: ['', [Validators.required, CustomValidators.nameValidator()]],
      lastName: ['', [Validators.required, CustomValidators.nameValidator()]],
      documentType: ['DNI', [Validators.required]],
      documentNumber: ['', [Validators.required]],
      phone: ['', [Validators.required, CustomValidators.phoneValidator()]],
      email: ['', [Validators.required, CustomValidators.emailValidator()]],
      address: [''],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: ['']
    });

    const documentNumberControl = form.get('documentNumber');
    const documentTypeControl = form.get('documentType');

    if (documentNumberControl && documentTypeControl) {
      documentNumberControl.setValidators([
        Validators.required,
        CustomValidators.documentValidator(documentTypeControl)
      ]);

      documentTypeControl.valueChanges.subscribe(() => {
        documentNumberControl.updateValueAndValidity();
      });
    }

    const newPasswordControl = form.get('newPassword');
    const confirmPasswordControl = form.get('confirmPassword');

    if (newPasswordControl) {
      newPasswordControl.setValidators([CustomValidators.passwordStrengthValidator()]);
      newPasswordControl.valueChanges.subscribe((value) => {
        this.passwordStrength = CustomValidators.getPasswordStrength(value || '');
      });
    }

    if (confirmPasswordControl && newPasswordControl) {
      confirmPasswordControl.setValidators([this.passwordMatchValidator(newPasswordControl)]);

      newPasswordControl.valueChanges.subscribe(() => {
        confirmPasswordControl.updateValueAndValidity();
      });
    }
    return form;
  }

  private passwordMatchValidator(passwordControl: AbstractControl) {
    return (control: AbstractControl) => {
      if (!control.value || !passwordControl.value) {
        return null;
      }
      return control.value === passwordControl.value ? null : { passwordMismatch: true };
    };
  }

  loadUserData() {
    this.loading = true;
    this.error = null;

    this.userService
      .getUserById(this.currentUser.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.userDetails = user;
          this.populateForm(user);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar datos del usuario:', error);
          this.error = 'Error al cargar los datos del perfil';
          this.loading = false;
        }
      });
  }
  private populateForm(user: User) {
    this.profileForm.patchValue({
      firstName: user.name,
      lastName: user.last_name,
      documentType: user.document_type,
      documentNumber: user.document_number,
      phone: user.phone,
      email: user.email,
      address: user.address
    });
  }
  onSubmit() {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formData = this.profileForm.value;

    const profileData: Partial<User> = {
      name: formData.firstName,
      last_name: formData.lastName,
      document_type: formData.documentType,
      document_number: formData.documentNumber,
      phone: formData.phone,
      email: formData.email,
      address: formData.address
    };

    if (formData.currentPassword && formData.newPassword) {
      this.updatePasswordAndProfile(profileData, formData);
    } else {
      this.updateProfile(profileData);
    }
  }
  private updateProfile(profileData: Partial<User>) {
    this.userService
      .partialUpdateUser(this.currentUser.userId, profileData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage = true;
          this.isSubmitting = false;

          const updatedCurrentUser = {
            ...this.currentUser,
            name: response.name,
            lastName: response.last_name,
            email: response.email,
            phone: response.phone,
            address: response.address
          };
          this.authService.updateCurrentUser(updatedCurrentUser);

          setTimeout(() => {
            this.router.navigate(['/client/dashboard']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error al actualizar perfil:', error);
          this.error = error.error?.message || 'Error al actualizar el perfil';
          this.isSubmitting = false;
        }
      });
  }

  private updatePasswordAndProfile(profileData: Partial<User>, formData: any) {
    const passwordChangeData = {
      username: this.currentUser.username,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    };

    this.authService
      .changePassword(passwordChangeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.updateProfile(profileData);
        },
        error: (error) => {
          console.error('Error al cambiar contraseña:', error);
          this.error = error.error?.message || 'Error al cambiar la contraseña';
          this.isSubmitting = false;
        }
      });
  }

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach((key) => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.router.navigate(['/client/dashboard']);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.profileForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }

      if (field.errors['invalidName']) {
        return field.errors['invalidName'].message;
      }

      if (field.errors['invalidDocument']) {
        return field.errors['invalidDocument'].message;
      }

      if (field.errors['invalidPhone']) {
        return field.errors['invalidPhone'].message;
      }

      if (field.errors['invalidEmail']) {
        return field.errors['invalidEmail'].message;
      }

      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }

      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }

    return null;
  }
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.errors && (field.dirty || field.touched));
  }

  goBack() {
    this.router.navigate(['/client/dashboard']);
  }

  togglePasswordVisibility(type: 'current' | 'new' | 'confirm') {
    switch (type) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }
}
