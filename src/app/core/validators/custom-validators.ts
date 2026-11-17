import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static nameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/;
      if (!nameRegex.test(control.value)) {
        return { invalidName: { message: 'Solo se permiten letras y espacios' } };
      }

      if (control.value.length < 2) {
        return { minlength: { requiredLength: 2, actualLength: control.value.length } };
      }

      return null;
    };
  }

  static documentValidator(documentTypeControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !documentTypeControl.value) return null;

      const documentType = documentTypeControl.value;
      const documentNumber = control.value;

      if (documentType === 'DNI') {
        const dniRegex = /^\d{8}$/;
        if (!dniRegex.test(documentNumber)) {
          return { invalidDocument: { message: 'DNI debe tener exactamente 8 dígitos' } };
        }
      } else if (documentType === 'CNE') {
        const cneRegex = /^[A-Za-z0-9]{20}$/;
        if (!cneRegex.test(documentNumber)) {
          return { invalidDocument: { message: 'CNE debe tener exactamente 20 caracteres (letras y números)' } };
        }
      }

      return null;
    };
  }

  static phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const phoneRegex = /^9\d{8}$/;
      if (!phoneRegex.test(control.value)) {
        return { invalidPhone: { message: 'Teléfono debe empezar con 9 y tener 9 dígitos' } };
      }

      return null;
    };
  }

  static passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const password = control.value;
      const errors: any = {};

      if (password.length < 8) {
        errors.minLength = true;
      }

      if (!/[a-z]/.test(password)) {
        errors.requiresLowercase = true;
      }

      if (!/[A-Z]/.test(password)) {
        errors.requiresUppercase = true;
      }

      if (!/[0-9]/.test(password)) {
        errors.requiresNumber = true;
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.requiresSpecial = true;
      }

      return Object.keys(errors).length ? { passwordStrength: errors } : null;
    };
  }

  static getPasswordStrength(password: string): { level: string; score: number; class: string } {
    if (!password) return { level: '', score: 0, class: '' };

    let score = 0;

    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;

    if (/[a-z]/.test(password)) score += 15;

    if (/[A-Z]/.test(password)) score += 15;

    if (/[0-9]/.test(password)) score += 15;

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    let level = '';
    let cssClass = '';

    if (score < 30) {
      level = 'Muy débil';
      cssClass = 'very-weak';
    } else if (score < 50) {
      level = 'Débil';
      cssClass = 'weak';
    } else if (score < 70) {
      level = 'Regular';
      cssClass = 'fair';
    } else if (score < 85) {
      level = 'Fuerte';
      cssClass = 'strong';
    } else {
      level = 'Muy fuerte';
      cssClass = 'very-strong';
    }
    return { level, score, class: cssClass };
  }
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const email = control.value.trim().toLowerCase();

      const atCount = (email.match(/@/g) || []).length;
      if (atCount !== 1) {
        return { invalidEmail: { message: 'El email debe contener exactamente un @' } };
      }

      const [localPart, domain] = email.split('@');

      if (!localPart || localPart.length === 0) {
        return { invalidEmail: { message: 'La parte local del email no puede estar vacía' } };
      }

      if (localPart.length > 64) {
        return { invalidEmail: { message: 'La parte local del email es demasiado larga' } };
      }
      if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return { invalidEmail: { message: 'El email no puede empezar o terminar con punto antes del @' } };
      }

      if (/\.\./.test(localPart)) {
        return { invalidEmail: { message: 'No se permiten puntos consecutivos' } };
      }

      if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
        return { invalidEmail: { message: 'Caracteres no válidos en el email' } };
      }

      if (!domain || domain.length === 0) {
        return { invalidEmail: { message: 'El dominio no puede estar vacío' } };
      }

      if (domain.length > 255) {
        return { invalidEmail: { message: 'El dominio es demasiado largo' } };
      }

      if (!domain.includes('.')) {
        return { invalidEmail: { message: 'El dominio debe contener al menos un punto' } };
      }

      if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
        return { invalidEmail: { message: 'El dominio no puede empezar o terminar con punto o guión' } };
      }

      const domainParts = domain.split('.');

      if (domainParts.length < 2) {
        return { invalidEmail: { message: 'El dominio debe tener al menos una extensión válida' } };
      }

      for (let i = 0; i < domainParts.length; i++) {
        const part = domainParts[i];

        if (part.length === 0) {
          return { invalidEmail: { message: 'El dominio no puede tener partes vacías' } };
        }

        if (part.length > 63) {
          return { invalidEmail: { message: 'Cada parte del dominio es demasiado larga' } };
        }

        if (part.startsWith('-') || part.endsWith('-')) {
          return { invalidEmail: { message: 'Las partes del dominio no pueden empezar o terminar con guión' } };
        }

        if (!/^[a-zA-Z0-9-]+$/.test(part)) {
          return { invalidEmail: { message: 'El dominio solo puede contener letras, números y guiones' } };
        }
      }

      const tld = domainParts[domainParts.length - 1];

      if (tld.length < 2) {
        return { invalidEmail: { message: 'La extensión del dominio debe tener al menos 2 caracteres' } };
      }

      if (tld.length > 6) {
        return { invalidEmail: { message: 'La extensión del dominio es demasiado larga' } };
      }

      if (!/^[a-zA-Z]+$/.test(tld)) {
        return { invalidEmail: { message: 'La extensión del dominio solo puede contener letras' } };
      }

      const validTlds = [
        'com',
        'org',
        'net',
        'edu',
        'gov',
        'mil',
        'int',
        'co',
        'pe',
        'es',
        'mx',
        'ar',
        'cl',
        'br',
        'uk',
        'de',
        'fr',
        'it',
        'jp',
        'cn',
        'ru',
        'in',
        'au',
        'ca',
        'nl',
        'se',
        'no',
        'dk',
        'fi',
        'pl',
        'cz',
        'hu',
        'ro',
        'bg',
        'hr',
        'sk',
        'si',
        'lt',
        'lv',
        'ee',
        'ie',
        'pt',
        'gr',
        'be',
        'at',
        'ch',
        'lu',
        'is',
        'mt',
        'cy',
        'us',
        'info',
        'biz',
        'name',
        'pro',
        'museum',
        'travel',
        'jobs',
        'mobi',
        'tel',
        'asia',
        'cat',
        'coop',
        'aero',
        'xxx',
        'today',
        'online',
        'tech',
        'store',
        'site',
        'website',
        'space',
        'live',
        'studio'
      ];

      if (!validTlds.includes(tld)) {
        return { invalidEmail: { message: 'Extensión de dominio no válida' } };
      }

      return null;
    };
  }
}
