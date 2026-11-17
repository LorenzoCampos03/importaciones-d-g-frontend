import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../interfaces/supplier.interface';
import { Employee } from '../interfaces/employee.interface';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private baseUrl = environment.apiUrl; // Asegúrate de que coincida con tu backend

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<any[]>(`${this.baseUrl}/suppliers`).pipe(
      map((suppliers) =>
        suppliers.map((s) => ({
          id: s.supplierId,
          name: s.supplierName
        }))
      )
    );
  }
  getEmployees(): Observable<Employee[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/employee/listEmployee`).pipe(
      map((employees) =>
        employees.map((emp) => ({
          id: emp.user_id, // mapeamos user_id a id
          name: emp.name
        }))
      )
    );
  }
}
