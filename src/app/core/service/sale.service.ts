import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale, SaleDetail } from '../interfaces/sale.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/sale`;
  private detailApiUrl = `${environment.apiUrl}/sale-details`;

  constructor(private http: HttpClient) {}

  // ventas
  getSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  getSaleById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  getSalesByStatus(status: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/status/${status}`);
  }
  getSalesByClient(clientId: number): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/client/${clientId}`);
  }

  // Métodos para ventas por empleado
  getSalesByEmployee(employeeId: number): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  getEmployeeSalesToday(employeeId: number): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/employee/${employeeId}/today`);
  }

  getEmployeeSalesSummary(employeeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employee/${employeeId}/summary`);
  }

  getActiveSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/active`);
  }
  updateSaleStatus(id: number, status: string): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restoreSale(id: number): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${id}/restore`, {});
  }

  // detalles de venta
  getSaleDetails(saleId: number): Observable<SaleDetail[]> {
    return this.http.get<SaleDetail[]>(`${this.detailApiUrl}/sale/${saleId}`);
  }

  getSaleDetailById(id: number): Observable<SaleDetail> {
    return this.http.get<SaleDetail>(`${this.detailApiUrl}/${id}`);
  }

  updateSaleDetail(saleId: number, detailId: number, detail: Partial<SaleDetail>): Observable<SaleDetail> {
    return this.http.put<SaleDetail>(`${this.apiUrl}/${saleId}/details/${detailId}`, detail);
  }

  deleteSaleDetail(saleId: number, detailId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${saleId}/details/${detailId}`);
  }

  addSaleDetail(saleId: number, detail: Partial<SaleDetail>): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.apiUrl}/${saleId}/details`, detail);
  }

  createSale(saleData: any): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, saleData);
  }

  updateSaleDetailQuantity(saleId: number, detailId: number, quantity: number): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${saleId}/details/${detailId}?quantity=${quantity}`, {});
  }

  removeSaleDetail(saleId: number, detailId: number): Observable<Sale> {
    return this.http.delete<Sale>(`${this.apiUrl}/${saleId}/details/${detailId}`);
  }

  addSaleDetailToSale(saleId: number, detailData: any): Observable<Sale> {
    return this.http.post<Sale>(`${this.apiUrl}/${saleId}/details`, detailData);
  }
}
