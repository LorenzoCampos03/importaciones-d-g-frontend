import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  protected baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  /**
   * Construye la URL completa para un endpoint
   */
  protected buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  /**
   * Construye parámetros HTTP
   */
  protected buildParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return httpParams;
  }

  /**
   * GET genérico
   */
  protected get<T>(endpoint: string, params?: { [key: string]: any }): Observable<T> {
    const options = params ? { params: this.buildParams(params) } : {};
    return this.http.get<T>(this.buildUrl(endpoint), options);
  }

  /**
   * POST genérico
   */
  protected post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body);
  }

  /**
   * PUT genérico
   */
  protected put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body);
  }

  /**
   * PATCH genérico
   */
  protected patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body);
  }

  /**
   * DELETE genérico
   */
  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }
}
