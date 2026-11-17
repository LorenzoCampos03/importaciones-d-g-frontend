import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interfaces/product.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = `${environment.apiUrl}/products`; // Ajusta si tu ruta base es distinta

  constructor(private http: HttpClient) {}

  // Obtener productos por estado (A = activos, I = inactivos)
  getByStatus(status: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/status/${status}`);
  }

  // Obtener todos los productos
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}`);
  }

  // Obtener productos disponibles para clientes (con stock)
  getAvailableProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/available`);
  }

  // Obtener producto disponible por ID para clientes
  getAvailableProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/available/${id}`);
  }

  // Desactivar (eliminación lógica)
  deactivate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/delete/${id}`, {});
  }

  reactivateProduct(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/restore/${id}`, {});
  }

  // Crear nuevo producto
  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${product.productId}`, product);
  }

  // Buscar por ID
  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  // Generar reporte de productos en PDF
  generateProductReport(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/reports/product`, {
      responseType: "blob",
    })
  }
}
