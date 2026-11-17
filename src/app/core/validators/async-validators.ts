import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap } from 'rxjs/operators';
import { ValidationService } from '../service/validation.service';

export class AsyncValidators {
  static usernameValidator(validationService: ValidationService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 3) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(500),
        switchMap((username) =>
          validationService.validateUsername(username).pipe(
            map((response) => (response.exists ? { usernameExists: { message: response.message } } : null)),
            catchError(() => of(null))
          )
        )
      );
    };
  }

  static emailValidator(validationService: ValidationService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !control.value.includes('@')) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(500),
        switchMap((email) =>
          validationService.validateEmail(email).pipe(
            map((response) => (response.exists ? { emailExists: { message: response.message } } : null)),
            catchError(() => of(null))
          )
        )
      );
    };
  }

  static documentValidator(
    validationService: ValidationService,
    documentTypeControl: AbstractControl
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !documentTypeControl.value) {
        return of(null);
      }

      const documentType = documentTypeControl.value;
      const documentNumber = control.value;

      if (documentType === 'DNI' && documentNumber.length !== 8) {
        return of(null);
      }
      if (documentType === 'CNE' && documentNumber.length !== 20) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(500),
        switchMap((docNumber) =>
          validationService.validateDocument(documentType, docNumber).pipe(
            map((response) => (response.exists ? { documentExists: { message: response.message } } : null)),
            catchError(() => of(null))
          )
        )
      );
    };
  }

  static phoneValidator(validationService: ValidationService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length !== 9) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(500),
        switchMap((phone) =>
          validationService.validatePhone(phone).pipe(
            map((response) => (response.exists ? { phoneExists: { message: response.message } } : null)),
            catchError(() => of(null))
          )
        )
      );
    };
  }
}
