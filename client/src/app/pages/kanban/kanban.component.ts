import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { KanbanService } from '../../core/services/kanban.service';
import { ChatService } from '../../core/services/chat.service';
import { ResourceService } from '../../core/services/resource.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './kanban.component.html',
})
export class KanbanComponent implements OnInit {
  kanbanService = inject(KanbanService);
  chatService = inject(ChatService);
  resourceService = inject(ResourceService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  projectId = '';
  activeTab = 'board';

  // Modals
  showAddModal = false;
  showEditModal = false;

  // Data
  newTaskTitle = '';
  newTaskMilestone = '';
  selectedTask: any = null;
  newTaskComment = '';

  // Subtask local states
  newSubtaskTitle = '';

  // Chat/Resource
  newMessage = '';
  newResource = { title: '', url: '', type: 'link' };
  currentUserId = '';

  columns = [{id:'todo', title:'To Do'}, {id:'in-progress', title:'In Progress'}, {id:'review', title:'Review'}, {id:'done', title:'Done'}];

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    const userStr = localStorage.getItem('user');
    if (userStr) this.currentUserId = JSON.parse(userStr).id;

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'chat') this.activeTab = 'chat';
    });

    if (this.projectId) this.loadData();
  }

  loadData() {
    this.kanbanService.getTasks(this.projectId).subscribe();
    this.chatService.getMessages(this.projectId).subscribe();
    this.resourceService.getResources(this.projectId).subscribe();
  }

  getTasksByStatus(status: string) { return this.kanbanService.tasks().filter(t => t.status === status); }
  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (this.authService.getRole() === 'client') {
      return; // Safe path: Clients cannot move cards
    }
    
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      task.status = newStatus;
      this.kanbanService.updateTaskStatus(task.id || task._id, newStatus).subscribe();
    }
  }

  addTask() {
    if (!this.newTaskTitle) return;
    this.kanbanService.createTask(this.projectId, { title: this.newTaskTitle, milestone: this.newTaskMilestone, status: 'todo' }).subscribe(() => {
      this.showAddModal = false;
      this.newTaskTitle = '';
      this.newTaskMilestone = '';
    });
  }

  openTask(task: any) {
    this.selectedTask = { ...task };
    this.showEditModal = true;
  }

  saveTask() {
    this.kanbanService.updateTask(this.selectedTask.id || this.selectedTask._id, this.selectedTask).subscribe(res => {
        this.kanbanService.tasks.update(tasks => tasks.map(t => (t.id === res.data.id || t._id === res.data._id) ? res.data : t));
        this.showEditModal = false;
    });
  }

  // Save task subtasks/changes inline silently in the background
  saveTaskInline() {
    if (!this.selectedTask) return;
    const id = this.selectedTask.id || this.selectedTask._id;
    this.kanbanService.updateTask(id, { subtasks: this.selectedTask.subtasks }).subscribe(res => {
       this.kanbanService.tasks.update(tasks => 
         tasks.map(t => (t.id === res.data.id || t._id === res.data._id) ? res.data : t)
       );
    });
  }

  // Subtask Management Methods
  addSubtask() {
    if (!this.newSubtaskTitle.trim() || !this.selectedTask) return;
    
    const subtasks = this.selectedTask.subtasks || [];
    subtasks.push({
      id: Date.now().toString(),
      title: this.newSubtaskTitle.trim(),
      isDone: false
    });
    
    this.selectedTask.subtasks = subtasks;
    this.saveTaskInline();
    this.newSubtaskTitle = '';
  }

  toggleSubtask(subtask: any) {
    if (!this.selectedTask) return;
    subtask.isDone = !subtask.isDone;
    this.saveTaskInline();
  }

  deleteSubtask(subtaskId: string) {
    if (!this.selectedTask) return;
    this.selectedTask.subtasks = (this.selectedTask.subtasks || []).filter((s: any) => s.id !== subtaskId);
    this.saveTaskInline();
  }

  addComment() {
    if(!this.newTaskComment) return;
    this.kanbanService.addComment(this.selectedTask.id || this.selectedTask._id, this.newTaskComment).subscribe(res => {
       this.selectedTask = res.data;
       this.kanbanService.tasks.update(tasks => tasks.map(t => (t.id === res.data.id || t._id === res.data._id) ? res.data : t));
       this.newTaskComment = '';
    });
  }

  isMe(senderId: string) { return senderId === this.currentUserId; }
  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.projectId, this.newMessage).subscribe(() => this.newMessage = '');
  }
  addResource() {
    if (!this.newResource.title || !this.newResource.url) return;
    this.resourceService.addResource(this.projectId, this.newResource).subscribe(() => {
      this.newResource = { title: '', url: '', type: 'link' };
    });
  }

  // Generates highly styled, distinctive text colors/bgs based on sender ID
  getUserTheme(senderId: string) {
    if (this.isMe(senderId)) {
      return 'bg-primary text-on-primary'; // Your own messages stay primary blue
    }

    const index = Math.abs(this.hashCode(senderId || '')) % 6;
    const schemes = [
      'bg-blue-50 text-blue-800 border border-blue-200/50',
      'bg-green-50 text-green-800 border border-green-200/50',
      'bg-purple-50 text-purple-800 border border-purple-200/50',
      'bg-orange-50 text-orange-800 border border-orange-200/50',
      'bg-pink-50 text-pink-800 border border-pink-200/50',
      'bg-teal-50 text-teal-800 border border-teal-200/50'
    ];
    return schemes[index];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }
}
