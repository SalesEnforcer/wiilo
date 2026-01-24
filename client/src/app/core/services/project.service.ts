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

  // Fetch Projects
  getProjects() {
    return this.http.get<any>(this.apiUrl, this.getHeaders()).pipe(
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
}
