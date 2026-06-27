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

  // Task comments modal states
  showEditModal = false;
  selectedTask: any = null;
  newTaskComment = '';

  project = signal<any>(null);
  tasks = this.kanbanService.tasks;
  resources = this.resourceService.resources;
  messages = this.chatService.messages;

  newMessage = '';

  columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
  ];

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
            const p = res.data.find((x: any) => x._id === this.projectId || x.id === this.projectId);
            this.project.set(p);
        }
      });
      this.kanbanService.getTasks(this.projectId).subscribe();
      this.invoiceService.getInvoices().subscribe();
      this.resourceService.getResources(this.projectId).subscribe();
      this.chatService.getMessages(this.projectId).subscribe();
    }
  }

  getTasksByStatus(status: string) {
    return this.kanbanService.tasks().filter(t => t.status === status);
  }

  openTask(task: any) {
    this.selectedTask = { ...task };
    this.showEditModal = true;
  }

  addComment() {
    if (!this.newTaskComment.trim()) return;
    this.kanbanService.addComment(this.selectedTask.id || this.selectedTask._id, this.newTaskComment).subscribe(res => {
       // Update modal view
       this.selectedTask = res.data;
       // Update list signals
       this.kanbanService.tasks.update(tasks => 
         tasks.map(t => (t.id === res.data.id || t._id === res.data._id) ? res.data : t)
       );
       this.newTaskComment = '';
    });
  }

  isMe(senderId: string) { return senderId === this.currentUserId; }
  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.projectId, this.newMessage).subscribe(() => this.newMessage = '');
  }
}
