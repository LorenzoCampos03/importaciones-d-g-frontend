import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ValidationResponse } from '../interfaces/auth.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private apiUrl = `${environment.apiUrl}/auth/validate`;

  constructor(private http: HttpClient) {}

  validateUsername(username: string): Observable<ValidationResponse> {
    return this.http.get<ValidationResponse>(`${this.apiUrl}/username/${username}`);
  }

  validateEmail(email: string): Observable<ValidationResponse> {
    return this.http.get<ValidationResponse>(`${this.apiUrl}/email/${email}`);
  }

  validateDocument(documentType: string, documentNumber: string): Observable<ValidationResponse> {
    return this.http.get<ValidationResponse>(
      `${this.apiUrl}/document?documentType=${documentType}&documentNumber=${documentNumber}`
    );
  }

  validatePhone(phone: string): Observable<ValidationResponse> {
    return this.http.get<ValidationResponse>(`${this.apiUrl}/phone/${phone}`);
  }
}
