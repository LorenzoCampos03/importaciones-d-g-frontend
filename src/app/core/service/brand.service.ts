import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Brand {
  brandId?: number;
  brandName: string;
  description?: string;
  country?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private baseUrl = `${environment.apiUrl}/brands`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.baseUrl);
  }
}
