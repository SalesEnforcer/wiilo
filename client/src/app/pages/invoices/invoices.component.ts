import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoices.component.html',
})
export class InvoicesComponent implements OnInit {
  invoiceService = inject(InvoiceService);
  projectService = inject(ProjectService);
  
  showModal = false;
  
  // Form Data
  newInvoice = {
    title: '',
    amount: 0,
    project: ''
  };

  // Signals
  projects = this.projectService.projects;

  // Computed Stats
  totalRevenue = computed(() => 
    this.invoiceService.invoices()
        .filter(i => i.status === 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0)
  );

  pendingRevenue = computed(() => 
    this.invoiceService.invoices()
        .filter(i => i.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0)
  );

  ngOnInit() {
    this.invoiceService.getInvoices().subscribe();
    // Ensure we have projects for the dropdown
    if (this.projectService.projects().length === 0) {
      this.projectService.getProjects().subscribe();
    }
  }

  onSubmit() {
    this.invoiceService.createInvoice(this.newInvoice).subscribe({
      next: () => {
        this.showModal = false;
        this.newInvoice = { title: '', amount: 0, project: '' };
      },
      error: (err) => alert('Failed to create invoice')
    });
  }

  markPaid(id: string) {
    this.invoiceService.markAsPaid(id).subscribe();
  }
}
