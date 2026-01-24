import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  resources = signal<any[]>([]);

  private getHeaders() {
    return { headers: { 'Authorization': `Bearer ${this.authService.getToken()}` } };
  }

  getResources(projectId: string) {
    return this.http.get<any>(`${this.apiUrl}/projects/${projectId}/resources`, this.getHeaders()).pipe(
      tap(res => this.resources.set(res.data))
    );
  }

  addResource(projectId: string, data: any) {
    return this.http.post<any>(`${this.apiUrl}/projects/${projectId}/resources`, data, this.getHeaders()).pipe(
      tap(res => this.resources.update(list => [...list, res.data]))
    );
  }
}
