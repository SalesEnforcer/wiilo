import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  tasks = signal<any[]>([]);

  private getHeaders() {
    return { headers: { 'Authorization': `Bearer ${this.authService.getToken()}` } };
  }

  getTasks(projectId: string) {
    return this.http.get<any>(`${this.apiUrl}/projects/${projectId}/tasks`, this.getHeaders()).pipe(
      tap(res => this.tasks.set(res.data))
    );
  }

  createTask(projectId: string, task: any) {
    return this.http.post<any>(`${this.apiUrl}/projects/${projectId}/tasks`, task, this.getHeaders()).pipe(
      tap(res => this.tasks.update(t => [...t, res.data]))
    );
  }

  updateTaskStatus(taskId: string, status: string) {
    return this.http.put<any>(`${this.apiUrl}/tasks/${taskId}`, { status }, this.getHeaders());
  }

  updateTask(taskId: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/tasks/${taskId}`, data, this.getHeaders());
  }

  addComment(taskId: string, text: string) {
    return this.http.post<any>(`${this.apiUrl}/tasks/${taskId}/comments`, { text }, this.getHeaders());
  }
}
