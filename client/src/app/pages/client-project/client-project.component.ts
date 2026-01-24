import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { KanbanService } from '../../core/services/kanban.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { ResourceService } from '../../core/services/resource.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-client-project',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './client-project.component.html',
})
export class ClientProjectComponent implements OnInit {
  route = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  kanbanService = inject(KanbanService);
  invoiceService = inject(InvoiceService);
  resourceService = inject(ResourceService);
  chatService = inject(ChatService);
  authService = inject(AuthService);

  activeTab = 'roadmap';
  projectId = '';
  currentUserId = '';

  project = signal<any>(null);
  tasks = this.kanbanService.tasks;
  resources = this.resourceService.resources;
  messages = this.chatService.messages;
  
  newMessage = '';

  projectInvoices = computed(() => {
    const pid = this.projectId;
    return this.invoiceService.invoices().filter(i => {
        const iPid = i.project?._id || i.project; 
        return iPid === pid;
    });
  });

  paidAmount = computed(() => 
    this.projectInvoices().filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0)
  );

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    const userStr = localStorage.getItem('user');
    if (userStr) this.currentUserId = JSON.parse(userStr).id;

    // CHECK FOR DEEP LINK
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'chat') {
        this.activeTab = 'chat';
      }
    });

    if (this.projectId) {
      this.projectService.getProjects().subscribe(res => {
        if(res.data) {
            const p = res.data.find((x: any) => x._id === this.projectId);
            this.project.set(p);
        }
      });
      this.kanbanService.getTasks(this.projectId).subscribe();
      this.invoiceService.getInvoices().subscribe();
      this.resourceService.getResources(this.projectId).subscribe();
      this.chatService.getMessages(this.projectId).subscribe();
    }
  }

  isMe(senderId: string) { return senderId === this.currentUserId; }
  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.projectId, this.newMessage).subscribe(() => this.newMessage = '');
  }
}
