import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/projects`;

  // Reactive State for Projects
  projects = signal<any[]>([]);

  // Get Headers with Token
  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Fetch Projects (supports status filter like 'archived' or 'active')
  getProjects(status?: string) {
    let url = this.apiUrl;
    if (status) {
      url = `${this.apiUrl}?status=${status}`;
    }
    return this.http.get<any>(url, this.getHeaders()).pipe(
      tap((res: any) => {
        if (res.success) {
          this.projects.set(res.data);
        }
      })
    );
  }

  // Create Project
  createProject(data: any) {
    return this.http.post<any>(this.apiUrl, data, this.getHeaders()).pipe(
      tap((res: any) => {
        if (res.success) {
          // Add new project to the signal list immediately (Optimistic UI)
          this.projects.update(values => [res.data, ...values]);
        }
      })
    );
  }

  // Update Project (Assign, unassign, resign, edit details)
  updateProject(id: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, this.getHeaders()).pipe(
      tap((res: any) => {
        if (res.success) {
          // Swap updated project inside our reactive state signal
          this.projects.update(values =>
            values.map(p => (p.id === id || p._id === id) ? res.data : p)
          );
        }
      })
    );
  }

  // Delete Project
  deleteProject(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      tap((res: any) => {
        if (res.success) {
          // Filter out the deleted project from our reactive signal array
          this.projects.update(values =>
            values.filter(p => p.id !== id && p._id !== id)
          );
        }
      })
    );
  }
}
