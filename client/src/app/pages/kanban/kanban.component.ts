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
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      task.status = newStatus;
      this.kanbanService.updateTaskStatus(task._id, newStatus).subscribe();
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
    this.kanbanService.updateTask(this.selectedTask._id, this.selectedTask).subscribe(res => {
        this.kanbanService.tasks.update(tasks => tasks.map(t => t._id === res.data._id ? res.data : t));
        this.showEditModal = false;
    });
  }

  addComment() {
    if(!this.newTaskComment) return;
    this.kanbanService.addComment(this.selectedTask._id, this.newTaskComment).subscribe(res => {
       // Update the modal view
       this.selectedTask = res.data;
       // Update the background list
       this.kanbanService.tasks.update(tasks => tasks.map(t => t._id === res.data._id ? res.data : t));
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
}
