import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/service/auth.service';
import { RegisterRequest } from '../../../core/interfaces/auth.interface';
import { CustomValidators } from '../../../core/validators/custom-validators';
import { ValidationService } from '../../../core/service/validation.service';
import { AsyncValidators } from '../../../core/validators/async-validators';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength: { level: string; score: number; class: string } = { level: '', score: 0, class: '' };

  documentTypes = [
    { value: 'DNI', label: 'DNI - Documento Nacional de Identidad' },
    { value: 'CNE', label: 'CNE - Carnet de Extranjería' }
  ];

  userTypes = [
    { value: 'personal', label: 'Persona' },
    { value: 'empresa', label: 'Empresa' }
  ];
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private validationService: ValidationService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.registerForm = this.formBuilder.group(
      {
        userType: ['personal', [Validators.required]],
        username: [
          '',
          [Validators.required, Validators.minLength(3)],
          [AsyncValidators.usernameValidator(this.validationService)]
        ],
        email: [
          '',
          [Validators.required, CustomValidators.emailValidator()],
          [AsyncValidators.emailValidator(this.validationService)]
        ],
        name: ['', [Validators.required, CustomValidators.nameValidator()]],
        lastName: ['', [Validators.required, CustomValidators.nameValidator()]],
        documentType: ['DNI', [Validators.required]],
        documentNumber: ['', [Validators.required]],
        phone: [
          '',
          [Validators.required, CustomValidators.phoneValidator()],
          [AsyncValidators.phoneValidator(this.validationService)]
        ],
        address: [''],
        razonSocial: [''],
        password: ['', [Validators.required, Validators.minLength(8), CustomValidators.passwordStrengthValidator()]],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: [this.passwordMatchValidator]
      }
    );

    this.setupDocumentValidation();

    this.setupUserTypeValidation();

    this.setupPasswordStrengthMonitoring();
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  private setupDocumentValidation() {
    const documentTypeControl = this.registerForm.get('documentType');
    const documentNumberControl = this.registerForm.get('documentNumber');

    if (documentTypeControl && documentNumberControl) {
      documentTypeControl.valueChanges.subscribe(() => {
        documentNumberControl.setValue('');
        documentNumberControl.updateValueAndValidity();
      });
      documentNumberControl.setValidators([
        Validators.required,
        CustomValidators.documentValidator(documentTypeControl)
      ]);

      documentNumberControl.setAsyncValidators([
        AsyncValidators.documentValidator(this.validationService, documentTypeControl)
      ]);
    }
  }

  private setupUserTypeValidation() {
    const userTypeControl = this.registerForm.get('userType');
    const razonSocialControl = this.registerForm.get('razonSocial');

    if (userTypeControl && razonSocialControl) {
      userTypeControl.valueChanges.subscribe((value) => {
        if (value === 'empresa') {
          razonSocialControl.setValidators([Validators.required]);
        } else {
          razonSocialControl.clearValidators();
          razonSocialControl.setValue('');
        }
        razonSocialControl.updateValueAndValidity();
      });
    }
  }

  private setupPasswordStrengthMonitoring() {
    const passwordControl = this.registerForm.get('password');
    if (passwordControl) {
      passwordControl.valueChanges.subscribe((value) => {
        this.passwordStrength = CustomValidators.getPasswordStrength(value || '');
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }
  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formValue = this.registerForm.value;
      const { confirmPassword, userType, ...userData } = formValue;

      const registerData: RegisterRequest = {
        ...userData,
        last_name: userData.lastName,
        document_type: userData.documentType,
        document_number: userData.documentNumber,
        razon_social: userData.razonSocial || null,
        role: 'Cliente',
        status: 'A'
      };

      delete (registerData as any).lastName;
      delete (registerData as any).documentType;
      delete (registerData as any).documentNumber;
      delete (registerData as any).razonSocial;

      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response && response.user_id) {
            this.notificationService.success('¡Registro Exitoso! Su cuenta ha sido creada correctamente.', 4000);

            setTimeout(() => {
              this.router.navigate(['/login'], {
                queryParams: { message: 'Registro exitoso. Puede iniciar sesión ahora.' }
              });
            }, 1000);
          } else {
            this.notificationService.error(
              'Error en el Registro: No se pudo completar el registro. Intente nuevamente.'
            );
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.log('Error completo:', error);

          if (error.status === 409) {
            this.notificationService.error(
              'Usuario ya Existe: El usuario o email ya están registrados. Intente con datos diferentes.'
            );
          } else if (error.status === 400) {
            this.notificationService.error(
              'Datos Inválidos: ' + (error.error?.message || 'Verifique los datos ingresados e intente nuevamente.')
            );
          } else if (error.status === 0) {
            this.notificationService.error(
              'Error de Conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.'
            );
          } else if (error.error && error.error.message) {
            this.notificationService.error('Error de Registro: ' + error.error.message);
          } else {
            this.notificationService.error('Error Inesperado: Ocurrió un error inesperado. Intente nuevamente.');
          }
        }
      });
    } else {
      this.markFormGroupTouched();
      this.notificationService.error(
        'Formulario Incompleto: Por favor, complete todos los campos requeridos correctamente.'
      );
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Ingrese un email válido';
      }
      if (field.errors['invalidEmail']) {
        return field.errors['invalidEmail'].message;
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${minLength} caracteres`;
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
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
      if (field.errors['passwordStrength']) {
        return 'La contraseña no cumple con los requisitos mínimos';
      }
      if (field.errors['usernameExists']) {
        return field.errors['usernameExists'].message;
      }
      if (field.errors['emailExists']) {
        return field.errors['emailExists'].message;
      }
      if (field.errors['documentExists']) {
        return field.errors['documentExists'].message;
      }
      if (field.errors['phoneExists']) {
        return field.errors['phoneExists'].message;
      }
    }
    return '';
  }

  getPasswordRequirements(): string[] {
    const requirements = [];
    const errors = this.registerForm.get('password')?.errors?.['passwordStrength'];

    if (errors) {
      if (errors.minLength) requirements.push('Al menos 8 caracteres');
      if (errors.requiresLowercase) requirements.push('Al menos una letra minúscula');
      if (errors.requiresUppercase) requirements.push('Al menos una letra mayúscula');
      if (errors.requiresNumber) requirements.push('Al menos un número');
      if (errors.requiresSpecial) requirements.push('Al menos un carácter especial');
    }

    return requirements;
  }

  isUserTypeEmpresa(): boolean {
    return this.registerForm.get('userType')?.value === 'empresa';
  }

  getDocumentPlaceholder(): string {
    const documentType = this.registerForm.get('documentType')?.value;
    return documentType === 'DNI' ? '12345678' : '12345678901234567890';
  }

  getDocumentMaxLength(): number {
    const documentType = this.registerForm.get('documentType')?.value;
    return documentType === 'DNI' ? 8 : 20;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      userType: 'Tipo de usuario',
      username: 'Usuario',
      email: 'Email',
      name: 'Nombre',
      lastName: 'Apellido',
      documentType: 'Tipo de documento',
      documentNumber: 'Número de documento',
      phone: 'Teléfono',
      address: 'Dirección',
      razonSocial: 'Razón social',
      password: 'Contraseña',
      confirmPassword: 'Confirmación de contraseña'
    };
    return displayNames[fieldName] || fieldName;
  }
}
