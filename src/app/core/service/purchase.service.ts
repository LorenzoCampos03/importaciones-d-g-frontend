import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Purchase, PurchaseStatus } from '../interfaces/purchase.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private baseUrl = `${environment.apiUrl}/purchases`;

  constructor(private http: HttpClient) { }

  getAllPurchases(): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(this.baseUrl);
  }

  getPurchaseById(id: number): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.baseUrl}/${id}`);
  }

  getPurchasesByStatus(status: PurchaseStatus): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`${this.baseUrl}/status/${status}`);
  }

  createPurchase(purchase: Purchase): Observable<Purchase> {
    return this.http.post<Purchase>(this.baseUrl, purchase);
  }

  updatePurchase(id: number, purchase: Purchase): Observable<Purchase> {
    return this.http.put<Purchase>(`${this.baseUrl}/${id}`, purchase);
  }

  cancelPurchase(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  generatePurchaseReport(purchaseId: number): Observable<Blob> {
  return this.http.get(`${environment.apiUrl}/reports/purchase/${purchaseId}`, {
    responseType: 'blob'
  });
}

}
