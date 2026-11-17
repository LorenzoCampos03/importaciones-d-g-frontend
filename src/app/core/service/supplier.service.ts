import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Supplier {
  supplierId?: number;
  supplierName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private baseUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.baseUrl);
  }
}
