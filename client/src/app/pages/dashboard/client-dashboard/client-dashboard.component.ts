import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ToastService } from '../../../core/services/toast.service';
// FIX: Added one more "../" to the path
import { RecentMessagesComponent } from '../../../shared/components/recent-messages/recent-messages.component';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RecentMessagesComponent], 
  templateUrl: './client-dashboard.component.html',
})
export class ClientDashboardComponent implements OnInit {
  projectService = inject(ProjectService);
  invoiceService = inject(InvoiceService);
  toastService = inject(ToastService);

  projects = this.projectService.projects;
  invoices = this.invoiceService.invoices;

  unpaidAmount = computed(() => 
    this.invoices()
        .filter(i => i.status !== 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0)
  );

  ngOnInit() {
    this.projectService.getProjects().subscribe();
    this.invoiceService.getInvoices().subscribe();
  }

  payInvoice(id: string) {
    if(!confirm('Simulate Payment?')) return;
    this.invoiceService.markAsPaid(id).subscribe({
      next: () => this.toastService.show('Payment Successful!', 'success'),
      error: () => this.toastService.show('Payment failed', 'error')
    });
  }
}
