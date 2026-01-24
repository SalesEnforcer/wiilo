import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  messages = signal<any[]>([]); // Project messages
  recentMessages = signal<any[]>([]); // Dashboard Feed

  private getHeaders() {
    return { headers: { 'Authorization': `Bearer ${this.authService.getToken()}` } };
  }

  getMessages(projectId: string) {
    return this.http.get<any>(`${this.apiUrl}/projects/${projectId}/messages`, this.getHeaders()).pipe(
      tap(res => this.messages.set(res.data))
    );
  }

  getRecentMessages() {
    return this.http.get<any>(`${this.apiUrl}/chat/recent`, this.getHeaders()).pipe(
      tap(res => this.recentMessages.set(res.data))
    );
  }

  sendMessage(projectId: string, content: string) {
    return this.http.post<any>(`${this.apiUrl}/projects/${projectId}/messages`, { content }, this.getHeaders()).pipe(
      tap(res => this.messages.update(msgs => [...msgs, res.data]))
    );
  }
}
