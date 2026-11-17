import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Office } from '../interfaces/office.interface';
import { environment } from '../../../environments/environment';

@Injectable({
     providedIn: 'root'
})
export class OfficeService {
     private apiUrl = `${environment.apiUrl}/office`;

     constructor(private http: HttpClient) { }

     getAllOffices(): Observable<Office[]> {
          return this.http.get<Office[]>(`${this.apiUrl}/all`);
     }

     getActiveOffices(): Observable<Office[]> {
          return this.http.get<Office[]>(`${this.apiUrl}/active`);
     }

     getOfficesByStatus(status: string): Observable<Office[]> {
          return this.http.get<Office[]>(`${this.apiUrl}/status/${status}`);
     }

     getOfficeById(id: number): Observable<Office> {
          return this.http.get<Office>(`${this.apiUrl}/${id}`);
     }

     createOffice(office: Office): Observable<Office> {
          return this.http.post<Office>(`${this.apiUrl}/create`, office);
     }

     updateOffice(office: Office): Observable<Office> {
          return this.http.put<Office>(`${this.apiUrl}/update`, office);
     }

     logicalDeleteOffice(id: number): Observable<any> {
          return this.http.put(`${this.apiUrl}/logicalDelete/${id}`, {});
     }

     restoreOffice(id: number): Observable<any> {
          return this.http.patch(`${this.apiUrl}/restore/${id}`, {});
     }

     permanentlyDeleteOffice(id: number): Observable<any> {
          return this.http.delete(`${this.apiUrl}/permanent/${id}`);
     }
}
