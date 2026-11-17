import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  AuthUser,
  ChangePasswordRequest,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest
} from '../interfaces/auth.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.token) {
          const user: AuthUser = {
            userId: response.userId!,
            username: response.username!,
            role: response.role!,
            name: response.name!,
            lastName: response.lastName!,
            email: response.email!,
            token: response.token,
            refreshToken: response.refreshToken
          };
          this.setCurrentUser(user);
        }
      })
    );
  }

  logout(): void {
    const user = this.getCurrentUser();
    if (user && user.username) {
      this.http.post(`${this.apiUrl}/logout?username=${user.username}`, {}).subscribe({
        error: () => {}
      });
    }

    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

  /**
   * Registrar nuevo usuario (cliente)
   */
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    const registerData = {
      ...userData,
      role: 'Cliente'
    };

    return this.http.post<any>(`${this.apiUrl}/register`, registerData).pipe(
      tap((response) => {
        if (response && response.userId) {
          console.log('Usuario registrado exitosamente:', response);
        }
      })
    );
  }
  changePassword(changePasswordRequest: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, changePasswordRequest);
  }

  refreshToken(): Observable<LoginResponse> {
    const user = this.getCurrentUser();
    if (!user || !user.refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshRequest: RefreshTokenRequest = {
      refreshToken: user.refreshToken
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, refreshRequest).pipe(
      tap((response) => {
        if (response.success && response.token) {
          const updatedUser: AuthUser = {
            ...user,
            token: response.token,
            refreshToken: response.refreshToken || user.refreshToken
          };
          this.setCurrentUser(updatedUser);
        }
      })
    );
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const isAuth = user !== null && this.isTokenValid(user.token);
    console.log('AuthService - isAuthenticated check:', { user: user?.username, isAuth });
    return isAuth;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    const user = this.getCurrentUser();
    return user ? user.token : null;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    const hasRole = user ? roles.includes(user.role) : false;
    console.log('AuthService - hasAnyRole check:', { userRole: user?.role, expectedRoles: roles, hasRole });
    return hasRole;
  }

  updateCurrentUser(updatedUserData: Partial<AuthUser>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser: AuthUser = {
        ...currentUser,
        ...updatedUserData
      };
      this.setCurrentUser(updatedUser);
      console.log('AuthService - User updated successfully:', updatedUser);
    }
  }

  private setCurrentUser(user: AuthUser): void {
    console.log('AuthService - Setting current user:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', user.token);
    if (user.refreshToken) {
      localStorage.setItem('refreshToken', user.refreshToken);
    }
    this.currentUserSubject.next(user);
    console.log('AuthService - User set successfully, currentUserSubject updated');
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user: AuthUser = JSON.parse(userJson);
        if (this.isTokenValid(user.token)) {
          this.currentUserSubject.next(user);
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        this.logout();
      }
    }
  }

  private isTokenValid(token: string): boolean {
    if (!token) return false;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
}
