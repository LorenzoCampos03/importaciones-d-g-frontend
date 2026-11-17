import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, ClientRequest, ClientUpdateRequest } from '../interfaces/client.interface';
import { environment } from '../../../environments/environment';

@Injectable({
     providedIn: 'root'
})
export class ClientService {
     private apiUrl = `${environment.apiUrl}/client`;

     constructor(private http: HttpClient) { }

     getActiveClients(): Observable<Client[]> {
          return this.http.get<Client[]>(`${this.apiUrl}/active`);
     }

     getAllClients(): Observable<Client[]> {
          return this.http.get<Client[]>(`${this.apiUrl}/all`);
     }

     getClientsByStatus(status: 'A' | 'I'): Observable<Client[]> {
          return this.http.get<Client[]>(`${this.apiUrl}/status/${status}`);
     }

     getClientById(id: number): Observable<Client> {
          return this.http.get<Client>(`${this.apiUrl}/${id}`);
     }

     createClient(client: ClientRequest): Observable<Client> {
          return this.http.post<Client>(`${this.apiUrl}/create`, client);
     }

     updateClient(client: ClientUpdateRequest): Observable<Client> {
          return this.http.put<Client>(`${this.apiUrl}/update`, client);
     }

     partialUpdateClient(id: number, updates: Partial<ClientUpdateRequest>): Observable<Client> {
          return this.http.patch<Client>(`${this.apiUrl}/partialUpdate/${id}`, updates);
     }

     logicalDeleteClient(id: number): Observable<void> {
          return this.http.put<void>(`${this.apiUrl}/logicalDelete/${id}`, {});
     }

     restoreClient(id: number): Observable<void> {
          return this.http.patch<void>(`${this.apiUrl}/restore/${id}`, {});
     }

     permanentDeleteClient(id: number): Observable<void> {
          return this.http.delete<void>(`${this.apiUrl}/permanent/${id}`);
     }
}
