import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}`; // Adjusted base

  currentUser = signal<any>(null);

  constructor() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUser.set(JSON.parse(user));
    }
  }

  // Get Role Helper
  getRole() {
    return this.currentUser()?.role || 'dev';
  }

  isAdmin() {
    return this.currentUser()?.role === 'superadmin';
  }

  register(data: any) {
    return this.http.post(`${this.apiUrl}/auth/register`, data).pipe(
      tap((res: any) => this.handleAuth(res))
    );
  }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res: any) => this.handleAuth(res))
    );
  }

  // Request Password Reset Link
  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  // New: Update Profile
  updateProfile(data: any) {
    const token = this.getToken();
    return this.http.put(`${this.apiUrl}/users/profile`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      tap((res: any) => {
        if (res.success) {
          const updatedUser = { ...this.currentUser(), ...res.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.currentUser.set(updatedUser);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuth(res: any) {
    if (res.success) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      this.currentUser.set(res.user);
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }
}
