import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/invoices`;

  invoices = signal<any[]>([]);

  private getHeaders() {
    return { headers: { 'Authorization': `Bearer ${this.authService.getToken()}` } };
  }

  getInvoices() {
    return this.http.get<any>(this.apiUrl, this.getHeaders()).pipe(
      tap(res => this.invoices.set(res.data))
    );
  }

  createInvoice(data: any) {
    return this.http.post<any>(this.apiUrl, data, this.getHeaders()).pipe(
      tap(res => this.invoices.update(prev => [res.data, ...prev]))
    );
  }

  markAsPaid(id: string) {
    return this.http.put<any>(`${this.apiUrl}/${id}/pay`, {}, this.getHeaders()).pipe(
      tap(res => {
        this.invoices.update(prev => prev.map(inv => inv._id === id ? res.data : inv));
      })
    );
  }
}
