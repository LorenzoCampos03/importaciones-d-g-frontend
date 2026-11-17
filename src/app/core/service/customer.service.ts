import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../service/base.service';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../interfaces/customer/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService extends BaseService {
  private endpoint = 'client';

  /**
   * Obtener todos los clientes activos
   */
  getActiveCustomers(): Observable<Customer[]> {
    return this.get<Customer[]>(`${this.endpoint}/active`);
  }

  /**
   * Obtener todos los clientes
   */
  getAllCustomers(): Observable<Customer[]> {
    return this.get<Customer[]>(`${this.endpoint}/all`);
  }

  /**
   * Obtener clientes por estado
   */
  getCustomersByStatus(status: string): Observable<Customer[]> {
    return this.get<Customer[]>(`${this.endpoint}/status/${status}`);
  }

  /**
   * Obtener cliente por ID
   */
  getCustomerById(id: number): Observable<Customer> {
    return this.get<Customer>(`${this.endpoint}/${id}`);
  }

  /**
   * Crear nuevo cliente
   */
  createCustomer(customer: CreateCustomerRequest): Observable<Customer> {
    return this.post<Customer>(`${this.endpoint}/create`, customer);
  }

  /**
   * Actualizar cliente
   */
  updateCustomer(customer: UpdateCustomerRequest): Observable<Customer> {
    return this.put<Customer>(`${this.endpoint}/update`, customer);
  }

  /**
   * Actualización parcial del cliente
   */
  partialUpdateCustomer(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.patch<Customer>(`${this.endpoint}/partialUpdate/${id}`, customer);
  }

  /**
   * Desactivar cliente (eliminación lógica)
   */
  deactivateCustomer(id: number): Observable<void> {
    return this.put<void>(`${this.endpoint}/logicalDelete/${id}`, {});
  }

  /**
   * Restaurar cliente
   */
  restoreCustomer(id: number): Observable<void> {
    return this.patch<void>(`${this.endpoint}/restore/${id}`, {});
  }
}
