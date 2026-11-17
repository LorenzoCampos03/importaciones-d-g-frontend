import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/client`;
  private employeeApiUrl = `${environment.apiUrl}/employee`;

  constructor(private http: HttpClient) { }

  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/active`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/all`);
  }

  getInactiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/status/I`);
  }
  getUsersByStatus(status: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/status/${status}`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/create`, user);
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/update`, user);
  }

  partialUpdateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/partialUpdate/${id}`, user);
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/logicalDelete/${id}`, {});
  }

  restoreUser(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/restore/${id}`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permanent/${id}`);
  }

  updateOwnProfile(id: number, profileData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/profile/update/${id}`, profileData);
  }

  getEmployeeById(id: number): Observable<User> {
    return this.http.get<User>(`${this.employeeApiUrl}/${id}`);
  }

  getAllEmployees(): Observable<User[]> {
    return this.http.get<User[]>(`${this.employeeApiUrl}/listEmployee`);
  }

  getAllEmployeesIncludingInactive(): Observable<User[]> {
    return this.http.get<User[]>(`${this.employeeApiUrl}/all`);
  }

  createEmployee(employee: User): Observable<User> {
    return this.http.post<User>(`${this.employeeApiUrl}/saveEmployee`, employee);
  }

  updateEmployee(employee: User): Observable<User> {
    return this.http.put<User>(`${this.employeeApiUrl}/update`, employee);
  }

  partialUpdateEmployee(id: number, employee: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.employeeApiUrl}/partialUpdate/${id}`, employee);
  }

  deactivateEmployee(id: number): Observable<void> {
    return this.http.put<void>(`${this.employeeApiUrl}/logicalDelete/${id}`, {});
  }

  restoreEmployee(id: number): Observable<void> {
    return this.http.patch<void>(`${this.employeeApiUrl}/restore/${id}`, {});
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.employeeApiUrl}/permanent/${id}`);
  }
}
