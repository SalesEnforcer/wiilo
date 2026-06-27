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

  // Fetch Team members (supports status='archived' for deactivated list)
  getTeam(status?: string) {
    let url = this.apiUrl;
    if (status) {
      url = `${this.apiUrl}?status=${status}`;
    }
    return this.http.get<any>(url, this.getHeaders()).pipe(
      tap(res => this.members.set(res.data))
    );
  }

  addMember(data: any) {
    return this.http.post<any>(this.apiUrl, data, this.getHeaders()).pipe(
      tap(res => this.members.update(prev => [res.data, ...prev]))
    );
  }

  // Edit or Archive/Restore a team member
  updateMember(id: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, this.getHeaders()).pipe(
      tap(res => {
        // Swap the updated member profile inside our reactive signal state
        this.members.update(prev =>
          prev.map(m => (m.id === id || m._id === id) ? res.data : m)
        );
      })
    );
  }
}
