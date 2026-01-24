import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/users`;

  // Signal for the UI
  members = signal<any[]>([]);

  private getHeaders() {
    return { headers: { 'Authorization': `Bearer ${this.authService.getToken()}` } };
  }

  getTeam() {
    return this.http.get<any>(this.apiUrl, this.getHeaders()).pipe(
      tap(res => this.members.set(res.data))
    );
  }

  addMember(data: any) {
    return this.http.post<any>(this.apiUrl, data, this.getHeaders()).pipe(
      tap(res => this.members.update(prev => [res.data, ...prev]))
    );
  }
}
